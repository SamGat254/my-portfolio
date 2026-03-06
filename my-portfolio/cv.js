/**
 * Auto-Generating CV Route
 * Pulls live data from DB to generate PDF/JSON CV
 */
const router = require('express').Router();
const { pool } = require('../db');
const PDFDocument = require('pdfkit');

// GET /api/cv/data — Public CV data (JSON)
router.get('/data', async (req, res) => {
  try {
    const [config, projects, skills, certs, timeline] = await Promise.all([
      pool.query('SELECT key, value FROM cv_config'),
      pool.query('SELECT title, tech_stack, status, created_at FROM projects WHERE is_published = TRUE ORDER BY created_at DESC'),
      pool.query('SELECT * FROM skills ORDER BY category, sort_order'),
      pool.query('SELECT title, issuer, date_issued FROM certifications ORDER BY date_issued DESC'),
      pool.query('SELECT * FROM timeline ORDER BY sort_order'),
    ]);

    const cfg = {};
    config.rows.forEach(r => cfg[r.key] = r.value);

    res.json({
      personal: cfg,
      projects: projects.rows,
      skills: skills.rows,
      certifications: certs.rows,
      timeline: timeline.rows,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: 'CV generation failed' });
  }
});

// GET /api/cv/pdf — Download CV as PDF
router.get('/pdf', async (req, res) => {
  try {
    const { rows: config } = await pool.query('SELECT key, value FROM cv_config');
    const { rows: projects } = await pool.query('SELECT title, tech_stack FROM projects WHERE is_published = TRUE LIMIT 10');
    const { rows: skills } = await pool.query('SELECT name, category FROM skills ORDER BY category');
    const { rows: certs } = await pool.query('SELECT title, issuer FROM certifications');

    const cfg = {};
    config.forEach(r => cfg[r.key] = r.value);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Samuel_Gatimu_CV.pdf"');
    doc.pipe(res);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text(cfg.full_name || 'Samuel Gatimu Kariuki', { align: 'center' });
    doc.fontSize(12).font('Helvetica').fillColor('#0099cc').text(cfg.title || 'Electrical & Electronic Engineering Student', { align: 'center' });
    doc.fillColor('#666').fontSize(10).text(`${cfg.email} | ${cfg.location} | ${cfg.github}`, { align: 'center' });
    doc.moveDown().moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc').moveDown();

    // Summary
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY');
    doc.font('Helvetica').fontSize(10).fillColor('#333').text(cfg.summary || '');
    doc.moveDown();

    // Education
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('EDUCATION');
    doc.font('Helvetica').fontSize(10).fillColor('#333');
    doc.text('B.Sc Electrical & Electronic Engineering — Chuka University (2022–Present)');
    doc.text('KCSE B+ — Langa Langa Secondary School (2021)');
    doc.moveDown();

    // Projects
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('PROJECTS');
    projects.forEach(p => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000').text(`• ${p.title}`);
      if (p.tech_stack) doc.font('Helvetica').fontSize(9).fillColor('#666').text(`  Technologies: ${p.tech_stack.join(', ')}`);
    });
    doc.moveDown();

    // Skills
    doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('SKILLS');
    const grouped = skills.reduce((acc, s) => {
      if (!acc[s.category]) acc[s.category] = [];
      acc[s.category].push(s.name);
      return acc;
    }, {});
    Object.entries(grouped).forEach(([cat, names]) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#000').text(`${cat}: `, { continued: true });
      doc.font('Helvetica').fillColor('#333').text(names.join(', '));
    });
    doc.moveDown();

    // Certifications
    if (certs.length > 0) {
      doc.fillColor('#000').fontSize(12).font('Helvetica-Bold').text('CERTIFICATIONS');
      certs.forEach(c => {
        doc.font('Helvetica').fontSize(10).fillColor('#333').text(`• ${c.title} — ${c.issuer}`);
      });
    }

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'PDF generation failed' });
  }
});

module.exports = router;
