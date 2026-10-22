const mangoose = require('mongoose');

const projectSchema = new mangoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,

    },
    owner: {
        type: mangoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,

    },
}, {
    timestamps: true
})

// CHANGE [filters]: WAS no index — GET /api/projects runs Project.find({ owner }) and had to
// scan every project of every user. This index lets MongoDB jump straight to one user's
// projects. Same idea as the Task index (see Task.js). SQL: CREATE INDEX ON projects (owner_id);
projectSchema.index({ owner: 1 });

module.exports = mangoose.model('Project', projectSchema);