const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    status: {
        type: String,
        enum: ['todo', 'in-progress', 'done'],
        default: 'todo'
    },
    dueDate: {
        type: Date
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    }
}, {
    timestamps: true
});

// ─── CHANGE [filters] ─────────────────────────────────────────────────────────
// WAS:    No index. Every GET /projects/:id/tasks made MongoDB scan EVERY task in the
//         collection (all users, all projects) to find the ones for this project.
// NOW:    A compound index on (project, status). An index is a sorted lookup table MongoDB
//         keeps beside the collection, so it can jump straight to "tasks of project X".
// HOW:    Compound indexes follow the "leftmost prefix" rule: this one speeds up queries on
//         `project` alone AND on `project + status` (the status filter), but not on `status`
//         alone. 1 = ascending order. Mongoose creates it automatically when the server starts.
// TRADE-OFF: indexes make reads faster but every insert/update must also update the index —
//         worth it here because tasks are read far more often than they're written.
// SQL:    CREATE INDEX ON tasks (project_id, status);
// ─────────────────────────────────────────────────────────────────────────────
taskSchema.index({ project: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
