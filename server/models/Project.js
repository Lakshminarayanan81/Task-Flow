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

module.exports = mangoose.model('Project', projectSchema);