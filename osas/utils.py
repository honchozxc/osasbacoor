import os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from django.conf import settings
from django.utils import timezone
import textwrap
from .models import Certificate


def generate_certificate_png(organization, certificate_date=None, venue=None, generated_by=None):
    try:
        # Create directory
        cert_dir = os.path.join(settings.MEDIA_ROOT, 'certificates')
        os.makedirs(cert_dir, exist_ok=True)

        # Certificate dimensions
        width, height = 1600, 945
        image = Image.new('RGB', (width, height), '#1b5e20')
        draw = ImageDraw.Draw(image)

        DARK_GREEN = '#1b5e20'
        MEDIUM_GREEN = '#2e7d32'
        LIGHT_GREEN = '#4caf50'
        GOLD = '#ffd700'
        CREAM = '#fffdf0'
        WHITE = '#ffffff'
        DARK_TEXT = '#1a237e'
        LIGHT_TEXT = '#2e3440'
        SIGNATURE_COLOR = '#1a237e'
        TITLE_COLOR = '#000000'
        HEADER_COLOR = '#111111'
        SUBTITLE_COLOR = '#222222'
        CONTENT_COLOR = '#333333'

        # Font Sizes
        try:
            title_font = ImageFont.truetype("arialbd.ttf", 54)
            header_font = ImageFont.truetype("arialbd.ttf", 32)
            org_name_font = ImageFont.truetype("arialbd.ttf", 48)
            body_font = ImageFont.truetype("arial.ttf", 26)
            signature_font = ImageFont.truetype("arialbd.ttf", 22)
            small_font = ImageFont.truetype("arial.ttf", 18)
            italic_font = ImageFont.truetype("ariali.ttf", 24)
        except:
            # Fallback to default fonts
            title_font = ImageFont.load_default()
            header_font = ImageFont.load_default()
            org_name_font = ImageFont.load_default()
            body_font = ImageFont.load_default()
            signature_font = ImageFont.load_default()
            small_font = ImageFont.load_default()
            italic_font = ImageFont.load_default()

        # Logo and E-Sign
        logo_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'cvsu-logo.png')
        marialyn_esign_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'e-sign', 'marialyn_sign.png')
        steffanie_esign_path = os.path.join(settings.BASE_DIR, 'static', 'images', 'e-sign', 'steffanie_sign.png')

        seal_logo = None
        marialyn_esign_image = None
        steffanie_esign_image = None

        try:
            # Load CVSU logo for center seal only
            if os.path.exists(logo_path):
                seal_logo = Image.open(logo_path).convert("RGBA")
                original_width, original_height = seal_logo.size
                seal_width = 700
                seal_height = int((seal_width / original_width) * original_height)
                seal_logo = seal_logo.resize((seal_width, seal_height), Image.Resampling.LANCZOS)

                r, g, b, a = seal_logo.split()
                a = a.point(lambda x: int(x * 0.55))
                seal_logo.putalpha(a)

                print(f"Center seal logo resized to: {seal_width}x{seal_height} with 55% opacity")
            else:
                print(f"Logo file not found at: {logo_path}")
        except Exception as e:
            print(f"Error loading logo: {e}")

        try:
            # Load Maria Lyn e-signature
            if os.path.exists(marialyn_esign_path):
                marialyn_esign_image = Image.open(marialyn_esign_path).convert("RGBA")
                marialyn_esign_image = marialyn_esign_image.resize((200, 85), Image.Resampling.LANCZOS)
                print("Maria Lyn e-signature loaded successfully")
            else:
                print(f"Maria Lyn e-signature file not found at: {marialyn_esign_path}")
        except Exception as e:
            print(f"Error loading Maria Lyn e-signature: {e}")

        try:
            # Load Steffanie Bato e-signature
            if os.path.exists(steffanie_esign_path):
                steffanie_esign_image = Image.open(steffanie_esign_path).convert("RGBA")
                steffanie_esign_image = steffanie_esign_image.resize((200, 85), Image.Resampling.LANCZOS)
                print("Steffanie Bato e-signature loaded successfully")
            else:
                print(f"Steffanie Bato e-signature file not found at: {steffanie_esign_path}")
        except Exception as e:
            print(f"Error loading Steffanie Bato e-signature: {e}")


        if seal_logo:
            try:
                seal_x = (width - seal_logo.width) // 2
                seal_y = (height - seal_logo.height) // 2

                image_rgba = image.convert('RGBA')
                seal_bg = Image.new('RGBA', image_rgba.size, (0, 0, 0, 0))
                seal_bg.paste(seal_logo, (seal_x, seal_y), seal_logo)
                image_with_seal = Image.alpha_composite(image_rgba, seal_bg)
                image = image_with_seal.convert('RGB')
                draw = ImageDraw.Draw(image)

                print(f"Center seal added at position: ({seal_x}, {seal_y})")
            except Exception as e:
                print(f"Error adding center seal: {e}")

        content_margin_x = 15
        content_margin_y = 20
        content_width = width - (content_margin_x * 2)
        content_height = height - (content_margin_y * 2)

        # Create overlay
        overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        overlay_draw = ImageDraw.Draw(overlay)
        overlay_draw.rectangle([
            content_margin_x,
            content_margin_y,
            width - content_margin_x,
            height - content_margin_y
        ], fill=(255, 253, 240, 150))

        image_rgba = image.convert('RGBA')
        image_with_overlay = Image.alpha_composite(image_rgba, overlay)
        image = image_with_overlay.convert('RGB')
        draw = ImageDraw.Draw(image)

        # Main border
        draw.rectangle([
            content_margin_x,
            content_margin_y,
            width - content_margin_x,
            height - content_margin_y
        ], outline=GOLD, width=5)

        # Decorative inner borders
        inner_margins = [20, 10, 5]
        border_colors = [MEDIUM_GREEN, LIGHT_GREEN, GOLD]

        for i, margin in enumerate(inner_margins):
            draw.rectangle([
                content_margin_x + margin,
                content_margin_y + margin,
                width - content_margin_x - margin,
                height - content_margin_y - margin
            ], outline=border_colors[i], width=2)

        corner_size = 30
        corners = [
            (content_margin_x, content_margin_y),
            (width - content_margin_x, content_margin_y),
            (content_margin_x, height - content_margin_y),
            (width - content_margin_x, height - content_margin_y)
        ]

        for corner_x, corner_y in corners:
            draw.line([corner_x, corner_y, corner_x + corner_size, corner_y], fill=GOLD, width=3)
            draw.line([corner_x, corner_y, corner_x, corner_y + corner_size], fill=GOLD, width=3)

        header_y = content_margin_y + 65

        university_text = "CAVITE STATE UNIVERSITY - BACOOR CITY CAMPUS"
        draw.text((width // 2, header_y), university_text, fill=HEADER_COLOR, font=header_font, anchor='mm')

        office_text = "OFFICE OF THE STUDENT AFFAIRS AND SERVICES"
        draw.text((width // 2, header_y + 40), office_text, fill=SUBTITLE_COLOR, font=body_font,
                  anchor='mm')

        unit_text = "STUDENT DEVELOPMENT AND SERVICES UNIT"
        draw.text((width // 2, header_y + 100), unit_text, fill=SUBTITLE_COLOR, font=body_font,
                  anchor='mm')

        title_y = header_y + 140
        title_text = "CERTIFICATE OF RECOGNITION"
        draw.text((width // 2, title_y), title_text, fill=TITLE_COLOR, font=title_font, anchor='mm')

        title_bbox = draw.textbbox((width // 2, title_y), title_text, font=title_font, anchor='mm')
        line_length = 380
        line_y = title_bbox[3] + 15

        draw.line([width // 2 - line_length, line_y, width // 2 - 80, line_y],
                  fill=GOLD, width=4)
        draw.line([width // 2 + 80, line_y, width // 2 + line_length, line_y],
                  fill=GOLD, width=4)

        content_start_y = title_y + 80

        # Line 1: "This Certificate of recognition awarded to:"
        line1_y = content_start_y
        line1_text = "This Certificate of Recognition is Awarded To:"
        draw.text((width // 2, line1_y), line1_text, fill=CONTENT_COLOR, font=body_font, anchor='mm')

        # Organization Name
        org_name_y = line1_y + 60
        org_name = organization.organization_name.upper()
        draw.text((width // 2, org_name_y), org_name, fill=TITLE_COLOR, font=org_name_font, anchor='mm')

        # Organization details
        details_y = org_name_y + 80

        # Get organization type display
        org_type_display = organization.get_organization_type_display().lower()

        # Validity period
        valid_from = organization.organization_valid_from.strftime('%B %d, %Y')
        valid_until = organization.organization_valid_until.strftime('%B %d, %Y')

        line2_text = f"As a duly recognized {org_type_display} of this institution, effective from {valid_from} to {valid_until}."

        wrapped_line2 = textwrap.fill(line2_text, width=95)
        lines2 = wrapped_line2.split('\n')

        for i, line in enumerate(lines2):
            draw.text((width // 2, details_y + (i * 32)), line, fill=CONTENT_COLOR, font=body_font, anchor='mm')

        # Authorization text
        auth_start_y = details_y + len(lines2) * 32 + 40
        auth_text = "From hereon, this organization is authorized to undertake projects and activities pertinent to its objectives, and constitution and by-laws as long as they are not contrary to existing University rules and regulations governing the conduct of the student organization."

        # Wrap authorization text with maximum width
        wrapped_auth = textwrap.fill(auth_text, width=100)
        auth_lines = wrapped_auth.split('\n')

        for i, line in enumerate(auth_lines):
            draw.text((width // 2, auth_start_y + (i * 30)), line, fill=CONTENT_COLOR, font=italic_font, anchor='mm')

        # Date and Venue
        date_section_y = auth_start_y + len(auth_lines) * 30 + 45

        # Parse certificate date
        cert_date = certificate_date or timezone.now()
        if isinstance(cert_date, str):
            from datetime import datetime
            cert_date = datetime.strptime(certificate_date, '%Y-%m-%d')

        day = cert_date.strftime('%d')
        month = cert_date.strftime('%B')
        year = cert_date.strftime('%Y')

        date_text = f"Given this {day} day of {month} in the year of our Lord {year}"
        draw.text((width // 2, date_section_y), date_text, fill=CONTENT_COLOR, font=body_font, anchor='mm')

        venue_text = venue or "Cavite State University - Bacoor City Campus Gymnasium"
        venue_y = date_section_y + 35
        draw.text((width // 2, venue_y), f"at {venue_text}.", fill=CONTENT_COLOR, font=body_font, anchor='mm')

        # Signature Section
        signatures_start_y = venue_y + 70

        # Three signatures
        col_width = width // 3
        signature_spacing = 38

        # First signature - MARIA LYN E. DELA CRUZ
        sig1_x = col_width // 2

        if marialyn_esign_image:
            esign1_y = signatures_start_y - 55
            image_rgba = image.convert('RGBA')
            image_rgba.paste(marialyn_esign_image, (sig1_x - 100, esign1_y), marialyn_esign_image)
            image = image_rgba.convert('RGB')
            draw = ImageDraw.Draw(image)

        draw.text((sig1_x, signatures_start_y), "MARIA LYN E. DELA CRUZ, LPT",
                  fill=SIGNATURE_COLOR, font=signature_font, anchor='mm')
        draw.text((sig1_x, signatures_start_y + signature_spacing),
                  "Head, Student Development & Services Unit",
                  fill=SUBTITLE_COLOR, font=small_font, anchor='mm')

        # Second signature - STEPFANIE M. BATO
        sig2_x = width // 2

        if steffanie_esign_image:
            esign2_y = signatures_start_y - 55
            image_rgba = image.convert('RGBA')
            image_rgba.paste(steffanie_esign_image, (sig2_x - 100, esign2_y), steffanie_esign_image)
            image = image_rgba.convert('RGB')
            draw = ImageDraw.Draw(image)

        draw.text((sig2_x, signatures_start_y), "STEPFANIE M. BATO, MIT",
                  fill=SIGNATURE_COLOR, font=signature_font, anchor='mm')
        draw.text((sig2_x, signatures_start_y + signature_spacing),
                  "Head, Office of Student Affairs & Services",
                  fill=SUBTITLE_COLOR, font=small_font, anchor='mm')

        # Third signature - MENYYLUZ S. MACALALAD
        sig3_x = width - col_width // 2
        draw.text((sig3_x, signatures_start_y), "MENYYLUZ S. MACALALAD, LPT, MBA",
                  fill=SIGNATURE_COLOR, font=signature_font, anchor='mm')
        draw.text((sig3_x, signatures_start_y + signature_spacing), "Campus Administrator",
                  fill=SUBTITLE_COLOR, font=small_font, anchor='mm')

        # Signature lines
        signature_line_y = signatures_start_y - 15
        line_length = 230

        for sig_x in [sig1_x, sig2_x, sig3_x]:
            draw.line([sig_x - line_length // 2, signature_line_y,
                       sig_x + line_length // 2, signature_line_y],
                      fill=SIGNATURE_COLOR, width=2)

        # Certificate ID
        cert_id_y = height - content_margin_y - 35
        cert_id = f"Certificate ID: {organization.id}-{timezone.now().strftime('%Y%m%d')}"
        draw.text((width // 2, cert_id_y), cert_id, fill=SUBTITLE_COLOR, font=small_font, anchor='mm')

        # Save Certificate
        # Generate filename
        current_date = timezone.now()
        year = current_date.strftime('%Y')
        month = current_date.strftime('%m')

        filename = f"certificate_{organization.id}_{current_date.strftime('%Y%m%d_%H%M%S')}.png"

        # Create the year/month directory structure
        year_month_dir = os.path.join(cert_dir, year, month)
        os.makedirs(year_month_dir, exist_ok=True)

        filepath = os.path.join(year_month_dir, filename)
        image.save(filepath, 'PNG', dpi=(300, 300), quality=95)

        print(f"Certificate with improved spacing generated: {filepath}")

        # Create Certificate Record to Database
        # Parse certificate date for the model
        if certificate_date:
            if isinstance(certificate_date, str):
                from datetime import datetime
                issue_date = datetime.strptime(certificate_date, '%Y-%m-%d').date()
            else:
                issue_date = certificate_date
        else:
            issue_date = timezone.now().date()

        # Create certificate record
        certificate = Certificate.objects.create(
            organization=organization,
            issue_date=issue_date,
            venue=venue or "Cavite State University - Bacoor City Campus Gymnasium",
            generated_by=generated_by
        )

        # Save the file to the certificate instance
        with open(filepath, 'rb') as cert_file:
            from django.core.files import File
            certificate.certificate_file.save(
                filename,
                File(cert_file),
                save=True
            )

        print(f"Certificate saved to database with ID: {certificate.id}")

        # Clean up the temporary file
        try:
            os.remove(filepath)
            print("Temporary file cleaned up")
        except Exception as e:
            print(f"Warning: Could not remove temporary file: {e}")

        return certificate

    except Exception as e:
        print(f"Certificate generation error: {e}")
        import traceback
        traceback.print_exc()
        return None