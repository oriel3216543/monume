
# MonuMe Logo Images

This folder should contain the following image files used by the application:

- `monume_logo.png` - The main MonuMe logo used in PDFs and emails
- `logo.png` - Alternative logo file name
- `pdf_template_preview.png` - Preview image for PDF templates in the email settings page
- `pdf_placeholder.png` - Placeholder image when template previews are not available

## Image Requirements

- Logo images should be PNG format with transparent background
- Recommended size for logos: 600px × 200px (3:1 aspect ratio)
- Recommended resolution: 144 DPI

## Missing Images?

If the PDF generator is failing to find the logo images:

1. Make sure one of these images exists in this folder:
   - `monume_logo.png` (preferred)
   - `logo.png` (alternative)

2. If you don't have logo images, create a simple placeholder with your company name:
   - Use an online logo generator or image editor
   - Save in PNG format in this directory
   - Use one of the filenames listed above

The PDF generator will look for logos in multiple locations, but this folder is the primary location.
