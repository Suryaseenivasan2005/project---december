const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
            default: '',
        },
        githubLink: {
            type: String,
            trim: true,
            default: '',
        },
        liveLink: {
            type: String,
            trim: true,
            default: '',
        },
        techStack: {
            type: String,
            trim: true,
            default: '',
        },
        progress: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },
        status: {
            type: String,
            enum: ['active', 'done', 'paused', 'planning'],
            default: 'active',
        },
        color: {
            type: String,
            default: '#6366f1',
        },
    },
    {
        timestamps: true, // adds createdAt and updatedAt automatically
    }
);

module.exports = mongoose.model('Project', ProjectSchema);
