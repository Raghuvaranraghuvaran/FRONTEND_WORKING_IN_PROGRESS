import html
from django.utils import timezone

def get_frontend_url():
    import os
    from django.conf import settings
    return getattr(settings, "FRONTEND_URL", os.getenv("FRONTEND_URL", "http://localhost:5174")).rstrip("/")

def build_delivery_confirmation_email(order):
    """
    Renders a responsive, high-converting HTML delivery confirmation email
    with a prominent Return Order CTA button.
    """
    frontend_url = get_frontend_url()
    return_url = f"{frontend_url}/orders/{order.id}/return"
    tracking_url = f"{frontend_url}/orders"

    order_number = html.escape(str(order.order_number))
    customer_name = html.escape(str(order.customer_name or "Valued Customer"))
    delivery_date = order.delivered_at.strftime("%d %b %Y, %I:%M %p") if order.delivered_at else timezone.now().strftime("%d %b %Y")
    total_inr = f"₹{order.total:,.2f}"

    # Build items HTML
    items_rows = ""
    for item in order.items.all():
        p_name = html.escape(str(item.name))
        p_qty = item.quantity
        p_price = f"₹{item.price:,.2f}"
        items_rows += f"""
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500;">
                {p_name}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">
                × {p_qty}
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">
                {p_price}
            </td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Order Has Been Delivered!</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                        
                        <!-- Header Banner -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 32px 30px; text-align: center;">
                                <div style="display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 8px 16px; border-radius: 50px; color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                                    ✓ Delivery Confirmed
                                </div>
                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">
                                    Your Order Has Arrived!
                                </h1>
                                <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">
                                    Order #{order_number} has been safely delivered to your doorstep.
                                </p>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 32px 30px;">
                                <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                                    Hi <strong>{customer_name}</strong>,
                                </p>
                                <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                                    We're pleased to inform you that your package was delivered on <strong>{delivery_date}</strong>. We hope you love your purchase!
                                </p>

                                <!-- Items Card -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                                    <tr>
                                        <td colspan="3" style="padding-bottom: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                                            Delivered Items
                                        </td>
                                    </tr>
                                    {items_rows}
                                    <tr>
                                        <td colspan="2" style="padding-top: 12px; font-size: 14px; font-weight: 700; color: #0f172a;">
                                            Total Amount
                                        </td>
                                        <td style="padding-top: 12px; text-align: right; font-size: 16px; font-weight: 800; color: #2563eb;">
                                            {total_inr}
                                        </td>
                                    </tr>
                                </table>

                                <!-- Prominent Return CTA Section -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; padding: 24px 20px; text-align: center; margin-bottom: 24px;">
                                    <tr>
                                        <td>
                                            <div style="font-size: 15px; font-weight: 700; color: #1e3a8a; margin-bottom: 6px;">
                                                Not completely satisfied?
                                            </div>
                                            <p style="margin: 0 0 16px 0; font-size: 13px; color: #3b82f6; line-height: 1.4;">
                                                You can request a replacement or return within <strong>7 days</strong> with doorstep pickup and instant refund.
                                            </p>
                                            <a href="{return_url}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                                                ↩ Return Order
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Action Buttons -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center">
                                            <a href="{tracking_url}" target="_blank" style="display: inline-block; color: #64748b; text-decoration: underline; font-size: 13px; font-weight: 500;">
                                                View Order Details & Invoices
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                    Protected by ReturnGuard Verified Storefront Protection · Official Tax Invoices & Easy Returns
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    plain_text = f"""
    Delivery Confirmation for Order #{order.order_number}

    Hi {order.customer_name or 'Valued Customer'},

    Your order #{order.order_number} was successfully delivered on {delivery_date}.

    Total Amount: {total_inr}

    Need to return an item?
    You can initiate a return within 7 days using the link below:
    {return_url}

    View your orders and tax invoices:
    {tracking_url}

    — The ReturnGuard Team
    """

    return html_content, plain_text


def build_merchant_return_alert_email(return_request, merchant):
    """
    Renders a notification email to the merchant with return details,
    product lines, customer reasons, description, and attached images.
    """
    frontend_url = get_frontend_url()
    review_url = f"{frontend_url}/merchant/flagged-cases"

    order = return_request.order
    customer_name = html.escape(str(return_request.customer_name or return_request.user.name))
    customer_email = html.escape(str(return_request.user.email))
    customer_phone = html.escape(str(return_request.user.phone or "N/A"))
    reason_label = html.escape(str(return_request.reason.replace("_", " ").title()))
    customer_note = html.escape(str(return_request.note or "No additional notes provided."))
    refund_method_label = html.escape(str(return_request.get_refund_method_display() if hasattr(return_request, 'get_refund_method_display') else return_request.refund_method))
    risk_tier = return_request.risk_tier
    order_number = html.escape(str(order.order_number))
    order_total = f"₹{order.total:,.2f}"

    # Items table
    items_rows = ""
    for line in return_request.return_lines.all():
        items_rows += f"""
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: 500;">
                {html.escape(line.name)}
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">
                × {line.quantity}
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a;">
                ₹{line.price:,.2f}
            </td>
        </tr>
        """

    # Images block
    images_html = ""
    if return_request.images and len(return_request.images) > 0:
        images_html = '<div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px;">'
        for img in return_request.images[:4]:
            images_html += f'<img src="{html.escape(img)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; margin-right: 8px;" alt="Return proof" />'
        images_html += '</div>'
    else:
        images_html = '<p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8;">No customer images attached.</p>'

    risk_bg = "#fee2e2" if risk_tier == "High" else "#fef3c7" if risk_tier == "Medium" else "#dcfce7"
    risk_color = "#dc2626" if risk_tier == "High" else "#d97706" if risk_tier == "Medium" else "#16a34a"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Return Request Alert</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background-color: #0f172a; padding: 28px 30px; text-align: left;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <span style="color: #38bdf8; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                                        Merchant Return Alert
                                    </span>
                                </div>
                                <h1 style="margin: 8px 0 0 0; color: #ffffff; font-size: 22px; font-weight: 800;">
                                    New Return Request for Order #{order_number}
                                </h1>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding: 28px 30px;">
                                <!-- Customer Info Card -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                                    <tr>
                                        <td>
                                            <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">{customer_name}</p>
                                            <p style="margin: 0 0 2px 0; font-size: 13px; color: #64748b;">📧 {customer_email}</p>
                                            <p style="margin: 0; font-size: 13px; color: #64748b;">📞 {customer_phone}</p>
                                        </td>
                                        <td align="right" valign="top">
                                            <span style="background-color: {risk_bg}; color: {risk_color}; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
                                                {risk_tier} Risk ({return_request.risk_score} pts)
                                            </span>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Return Details -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                                    <tr>
                                        <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">Return Reason:</td>
                                        <td style="font-size: 13px; font-weight: 700; color: #0f172a; padding-bottom: 6px; text-align: right;">{reason_label}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">Refund Method:</td>
                                        <td style="font-size: 13px; font-weight: 700; color: #0f172a; padding-bottom: 6px; text-align: right;">{refund_method_label}</td>
                                    </tr>
                                    <tr>
                                        <td style="font-size: 13px; color: #64748b; padding-bottom: 6px;">Order Amount:</td>
                                        <td style="font-size: 13px; font-weight: 700; color: #2563eb; padding-bottom: 6px; text-align: right;">{order_total}</td>
                                    </tr>
                                </table>

                                <!-- Customer Note -->
                                <div style="background-color: #f1f5f9; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px;">
                                    <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Customer Description:</span>
                                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155; line-height: 1.5;">{customer_note}</p>
                                </div>

                                <!-- Items -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                                    <tr>
                                        <td colspan="3" style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                                            Requested Item(s)
                                        </td>
                                    </tr>
                                    {items_rows}
                                </table>

                                <!-- Images -->
                                <div style="margin-bottom: 24px;">
                                    <span style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b;">Uploaded Images:</span>
                                    {images_html}
                                </div>

                                <!-- Review CTA -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center;">
                                    <tr>
                                        <td>
                                            <a href="{review_url}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 10px;">
                                                🔍 Review Request in Portal
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 30px; text-align: center;">
                                <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                                    ReturnGuard Automated Risk & Return System · {merchant.business_name}
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

    plain_text = f"""
    New Return Request for Order #{order_number}

    Customer: {customer_name} ({customer_email}, {customer_phone})
    Risk Tier: {risk_tier} ({return_request.risk_score} pts)
    Return Reason: {reason_label}
    Refund Method: {refund_method_label}
    Customer Note: {customer_note}
    Order Amount: {order_total}

    Review this return request in your merchant dashboard:
    {review_url}

    — ReturnGuard
    """

    return html_content, plain_text
