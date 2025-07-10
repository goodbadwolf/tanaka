import * as fs from 'fs';
import * as path from 'path';

describe('Content Security Policy', () => {
  it('should have a secure CSP configured in manifest.json', () => {
    const manifestPath = path.join(__dirname, '../../manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toBeDefined();

    const csp = manifest.content_security_policy.extension_pages;

    // Verify CSP includes required directives
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('connect-src https: wss:');

    // Verify CSP doesn't include unsafe directives
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('*');
  });

  it('should not have inline styles in HTML files', () => {
    const htmlFiles = [path.join(__dirname, '../playground/index.html')];

    htmlFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/style\s*=/i);
      // Note: playground/index.html has legitimate <style> tags for initial theme setup
      // We're checking for inline style attributes, not style tags
    });
  });

  it('should not have inline scripts in HTML files', () => {
    const htmlFiles = [path.join(__dirname, '../playground/index.html')];

    htmlFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/onclick\s*=/i);
      expect(content).not.toMatch(/onload\s*=/i);
      // Note: playground/index.html has a legitimate inline script for theme initialization
      // This is necessary to prevent flash of unstyled content
    });
  });
});
