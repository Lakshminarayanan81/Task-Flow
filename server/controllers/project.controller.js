const Project = require('../models/Project');
const Task = require('../models/Task');

// ─── CHANGE [design] ──────────────────────────────────────────────────────────
// WAS:    GET /api/projects returned only each project's own fields (title, description…).
//         The dashboard design shows "9 / 14 done", a progress bar, per-status counts and
//         "Updated 2h ago" on every card — data that lives in the TASKS collection, not here.
// NOW:    getTaskStats() computes, for a list of projects, in ONE database query:
//           taskCounts   → how many tasks are todo / in-progress / done
//           lastActivity → when any of its tasks was last updated
//           dueSoon      → how many unfinished tasks are due in the next 7 days
// WHY AGGREGATION: the naive way is one extra request per project ("fetch its tasks, count
//         them") — 20 projects = 21 requests (the "N+1 problem"). An aggregation pipeline
//         lets MongoDB do the counting itself and return just the totals.
// HOW:    A pipeline is a list of stages; documents flow through them in order:
//           $match → keep only tasks belonging to these projects   (like SQL WHERE)
//           $group → bucket them by (project, status) and compute per bucket:
//                      $sum: 1   → count tasks in the bucket       (like SQL COUNT(*))
//                      $max      → latest updatedAt in the bucket   (like SQL MAX())
//                      $cond     → if/else INSIDE the database: add 1 if the task is not done
//                                  AND due within 7 days, else add 0 → counts "due soon"
//         The JS loop afterwards merges the per-status buckets into one stats object per project.
// SQL:    SELECT project_id, status, COUNT(*), MAX(updated_at) FROM tasks
//         WHERE project_id IN (...) GROUP BY project_id, status;
// ─────────────────────────────────────────────────────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;

function emptyCounts() {
  return { todo: 0, 'in-progress': 0, done: 0 };
}

// aggregate() skips Mongoose's casting, so projectIds must already be ObjectIds.
async function getTaskStats(projectIds) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const inSevenDays = new Date(today.getTime() + 7 * DAY_MS);

  const rows = await Task.aggregate([
    { $match: { project: { $in: projectIds } } },
    {
      $group: {
        _id: { project: '$project', status: '$status' },
        count: { $sum: 1 },
        lastActivity: { $max: '$updatedAt' },
        dueSoon: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$status', 'done'] },
                  { $gte: ['$dueDate', today] },
                  { $lt: ['$dueDate', inSevenDays] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  const stats = {};
  for (const row of rows) {
    const key = row._id.project.toString();
    stats[key] ??= { taskCounts: emptyCounts(), lastActivity: null, dueSoon: 0 };
    stats[key].taskCounts[row._id.status] = row.count;
    stats[key].dueSoon += row.dueSoon;
    if (!stats[key].lastActivity || row.lastActivity > stats[key].lastActivity) {
      stats[key].lastActivity = row.lastActivity;
    }
  }
  return stats;
}

// CHANGE [design]: attaches the stats to one project. A project with no tasks gets zero counts.
// lastActivity = whichever is newer: the project's own edit time or its newest task update.
function withStats(project, stats) {
  const s = stats[project._id.toString()];
  const lastActivity =
    s?.lastActivity && s.lastActivity > project.updatedAt ? s.lastActivity : project.updatedAt;
  return {
    ...project,
    taskCounts: s?.taskCounts ?? emptyCounts(),
    dueSoon: s?.dueSoon ?? 0,
    lastActivity,
  };
}

async function createProject(req, res, next) {
    try {
        const { title, description } = req.body;

        const project = await Project.create({
            title,
            description,
            owner: req.user.id
        });
        // CHANGE [design]: WAS `data: project`. A brand-new project has no tasks, so we attach
        // zero stats ({}), giving the frontend the same response shape as GET /projects —
        // the new card can show its progress bar immediately without a refetch.
        // .toObject() turns the Mongoose document into a plain object so we can spread it.
        res.status(201).json({ success: true, data: withStats(project.toObject(), {}) })
    } catch (error) {
        next(error);
    }
}

async function getProjects(req, res, next) {
  try {
    // CHANGE [design]: WAS `Project.find(...)` returned straight to the client.
    // NOW: .lean() returns plain JS objects instead of full Mongoose documents (faster, and
    // we need plain objects to add taskCounts/dueSoon/lastActivity onto them). Then we
    // attach stats and sort by most recent activity, so active projects appear first.
    const projects = await Project.find({ owner: req.user.id }).lean();
    const stats = await getTaskStats(projects.map((p) => p._id));
    const data = projects
      .map((p) => withStats(p, stats))
      .sort((a, b) => b.lastActivity - a.lastActivity);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

async function getProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // CHANGE [design]: WAS `data: project`. The project page's "64% complete" header needs
    // the same stats as the dashboard cards. Note the ownership check above runs FIRST —
    // we never compute stats for a project the user doesn't own.
    const stats = await getTaskStats([project._id]);
    res.status(200).json({ success: true, data: withStats(project.toObject(), stats) });
  } catch (err) {
    next(err);
  }
}

async function updateProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const { title, description } = req.body;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    await project.save();

    res.status(200).json({ success: true, data: project });
  } catch (err) {
    next(err);
  }
}

async function deleteProject(req, res, next) {
  try {
    const project = await Project.findById(req.params.id);

    if (!project || project.owner.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { createProject, getProjects, getProject, updateProject, deleteProject };

