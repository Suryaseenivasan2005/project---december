const express = require('express');
const router = express.Router();
const Project = require('../models/Project');

// ─────────────────────────────────────────
// GET  /api/projects — Fetch all projects
// ─────────────────────────────────────────
router.get('/', async (req, res) => {
    try {
        const projects = await Project.find().sort({ createdAt: -1 });
        res.json({ success: true, count: projects.length, data: projects });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────
// GET  /api/projects/:id — Fetch one project
// ─────────────────────────────────────────
router.get('/:id', async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        res.json({ success: true, data: project });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────
// POST /api/projects — Create a new project
// ─────────────────────────────────────────
router.post('/', async (req, res) => {
    try {
        const { name, description, githubLink, liveLink, techStack, progress, status, color } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Project name is required' });
        }

        const project = await Project.create({
            name: name.trim(),
            description: description?.trim() || '',
            githubLink: githubLink?.trim() || '',
            liveLink: liveLink?.trim() || '',
            techStack: techStack?.trim() || '',
            progress: progress ?? 0,
            status: status || 'active',
            color: color || '#6366f1',
        });

        res.status(201).json({ success: true, data: project });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────
// PUT  /api/projects/:id — Update a project
// ─────────────────────────────────────────
router.put('/:id', async (req, res) => {
    try {
        const { name, description, githubLink, liveLink, techStack, progress, status, color } = req.body;

        const updateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (description !== undefined) updateData.description = description.trim();
        if (githubLink !== undefined) updateData.githubLink = githubLink.trim();
        if (liveLink !== undefined) updateData.liveLink = liveLink.trim();
        if (techStack !== undefined) updateData.techStack = techStack.trim();
        if (progress !== undefined) updateData.progress = Number(progress);
        if (status !== undefined) updateData.status = status;
        if (color !== undefined) updateData.color = color;

        const project = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        res.json({ success: true, data: project });
    } catch (err) {
        if (err.name === 'ValidationError') {
            const messages = Object.values(err.errors).map((e) => e.message);
            return res.status(400).json({ success: false, message: messages.join(', ') });
        }
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// ─────────────────────────────────────────
// DELETE /api/projects/:id — Delete a project
// ─────────────────────────────────────────
router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }
        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
