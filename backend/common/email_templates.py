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


def build_return_status_update_email(return_request, action, merchant, notes=""):
    """
    Renders a responsive, aesthetic HTML email notifying the customer
    whenever their return request is Approved, Declined/Rejected,
    Product Returned, or Refund Processed.
    """
    frontend_url = get_frontend_url()
    orders_url = f"{frontend_url}/orders"

    order = return_request.order
    order_number = html.escape(str(getattr(order, "order_number", f"#{return_request.order_id}")))
    return_id = return_request.id
    customer_name = html.escape(str(return_request.customer_name or getattr(return_request.user, "name", "Valued Customer")))
    merchant_name = html.escape(str(getattr(merchant, "business_name", "Our Store")))
    reason_label = html.escape(str(return_request.reason).replace("_", " ").title())
    refund_method_label = html.escape(str(getattr(return_request, "refund_method", "original")).replace("_", " ").title())
    order_total = f"₹{getattr(order, 'total', 0):,.2f}" if order else "N/A"
    decision_notes = html.escape(str(notes).strip()) if notes else ""

    action_norm = action.lower()

    if action_norm in ("approve", "approved"):
        badge_text = "✓ Return Request Approved"
        badge_bg = "rgba(16, 185, 129, 0.2)"
        banner_gradient = "linear-gradient(135deg, #059669 0%, #10b981 100%)"
        headline = "Your Return Has Been Approved!"
        subheadline = f"Order {order_number} has been approved for return by {merchant_name}."
        status_color = "#059669"
        status_title = "Return Approved — Pickup Scheduled"
        instructions_title = "Next Steps for Pickup:"
        instructions_text = """
        <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.6;">
            <li>Keep the item(s) packed in their original box with price tags intact.</li>
            <li>Our courier partner will arrive for doorstep pickup within <strong>24–48 hours</strong>.</li>
            <li>Once inspected, your refund will be disbursed via <strong>{refund_method_label}</strong>.</li>
        </ul>
        """.replace("{refund_method_label}", refund_method_label)
        cta_text = "📦 Track Return Status"
        subject = f"Return Approved: Order #{order_number} — Pickup Scheduled"

    elif action_norm in ("reject", "rejected"):
        badge_text = "✕ Return Request Declined"
        badge_bg = "rgba(239, 68, 68, 0.2)"
        banner_gradient = "linear-gradient(135deg, #dc2626 0%, #e11d48 100%)"
        headline = "Update on Your Return Request"
        subheadline = f"Your return request for Order {order_number} could not be approved."
        status_color = "#dc2626"
        status_title = "Return Request Declined"
        instructions_title = "Reason for Decision:"
        default_reject_note = "Your return request was evaluated against our return policy criteria and cannot be processed at this time."
        instructions_text = f"""
        <p style="margin: 8px 0 0 0; color: #475569; font-size: 13px; line-height: 1.6;">
            {decision_notes or default_reject_note}
        </p>
        <p style="margin: 12px 0 0 0; color: #64748b; font-size: 12px;">
            If you believe this was an error or have additional photos/evidence to share, please reply directly to this email or contact {merchant_name} support.
        </p>
        """
        cta_text = "🔍 View Order Details"
        subject = f"Update on Your Return Request: Order #{order_number}"

    elif action_norm == "product_returned":
        badge_text = "📦 Package Received"
        badge_bg = "rgba(79, 70, 229, 0.2)"
        banner_gradient = "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)"
        headline = "We Received Your Returned Package"
        subheadline = f"Your returned items for Order {order_number} have arrived at our warehouse."
        status_color = "#4f46e5"
        status_title = "Package Received — Quality Verification"
        instructions_title = "What happens next?"
        instructions_text = """
        <p style="margin: 8px 0 0 0; color: #475569; font-size: 13px; line-height: 1.6;">
            Our team is performing a quick quality verification. Your refund will be initiated immediately upon completion.
        </p>
        """
        cta_text = "📋 View Return Status"
        subject = f"Package Received: Return #{return_id} (Order #{order_number})"

    else:  # refund_processed
        badge_text = "💰 Refund Processed"
        badge_bg = "rgba(13, 148, 136, 0.2)"
        banner_gradient = "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
        headline = "Your Refund Has Been Processed!"
        subheadline = f"Refund of {order_total} for Order {order_number} has been completed."
        status_color = "#0d9488"
        status_title = "Refund Successfully Transferred"
        instructions_title = "Refund Details:"
        instructions_text = f"""
        <p style="margin: 8px 0 0 0; color: #475569; font-size: 13px; line-height: 1.6;">
            The amount of <strong>{order_total}</strong> has been refunded via <strong>{refund_method_label}</strong>.
        </p>
        <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">
            Depending on your bank/payment provider, it may take 2–4 business days to reflect on your statement. Store credit / reward points are available instantly in your account.
        </p>
        """
        cta_text = "🛍️ Continue Shopping"
        subject = f"Refund Processed: {order_total} for Order #{order_number}"

    # Build line items
    items_rows = ""
    lines = return_request.return_lines.all()
    if lines.exists():
        for line in lines:
            items_rows += f"""
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px; font-weight: 500;">
                    {html.escape(line.name)}
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b; font-size: 13px;">
                    × {line.quantity}
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 13px;">
                    ₹{line.price:,.2f}
                </td>
            </tr>
            """
    elif order and order.items.exists():
        for item in order.items.all():
            items_rows += f"""
            <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-size: 13px; font-weight: 500;">
                    {html.escape(item.name)}
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b; font-size: 13px;">
                    × {item.quantity}
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #0f172a; font-size: 13px;">
                    ₹{item.price:,.2f}
                </td>
            </tr>
            """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{subject}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
            <tr>
                <td align="center">
                    <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                        
                        <!-- Header Banner -->
                        <tr>
                            <td style="background: {banner_gradient}; padding: 32px 30px; text-align: center;">
                                <div style="display: inline-block; background: {badge_bg}; padding: 8px 16px; border-radius: 50px; color: #ffffff; font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px;">
                                    {badge_text}
                                </div>
                                <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">
                                    {headline}
                                </h1>
                                <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                                    {subheadline}
                                </p>
                            </td>
                        </tr>

                        <!-- Body Content -->
                        <tr>
                            <td style="padding: 32px 30px;">
                                <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.5;">
                                    Hi <strong>{customer_name}</strong>,
                                </p>

                                <!-- Status Summary Box -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                                    <tr>
                                        <td style="padding-bottom: 8px;">
                                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                                                Return Request ID
                                            </span>
                                            <div style="font-size: 15px; font-weight: 700; color: #0f172a; font-family: monospace;">
                                                #{return_id} (Order {order_number})
                                            </div>
                                        </td>
                                        <td style="padding-bottom: 8px; text-align: right;">
                                            <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                                                Status
                                            </span>
                                            <div style="font-size: 13px; font-weight: 700; color: {status_color};">
                                                {status_title}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding-top: 8px; border-top: 1px solid #e2e8f0;">
                                            <span style="font-size: 11px; color: #64748b;">Reason:</span>
                                            <span style="font-size: 12px; font-weight: 600; color: #334155;">{reason_label}</span>
                                        </td>
                                        <td style="padding-top: 8px; border-top: 1px solid #e2e8f0; text-align: right;">
                                            <span style="font-size: 11px; color: #64748b;">Refund Mode:</span>
                                            <span style="font-size: 12px; font-weight: 600; color: #334155;">{refund_method_label}</span>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Next Steps / Decision Notes Box -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
                                    <tr>
                                        <td>
                                            <h4 style="margin: 0; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em;">
                                                {instructions_title}
                                            </h4>
                                            {instructions_text}
                                        </td>
                                    </tr>
                                </table>

                                <!-- Line Items Table (if any) -->
                                {f'''
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td colspan="3" style="padding-bottom: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                                            Return Items
                                        </td>
                                    </tr>
                                    {items_rows}
                                </table>
                                ''' if items_rows else ''}

                                <!-- CTA Button -->
                                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center; margin-top: 8px;">
                                    <tr>
                                        <td>
                                            <a href="{orders_url}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);">
                                                {cta_text}
                                            </a>
                                        </td>
                                    </tr>
                                </table>

                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 30px; text-align: center;">
                                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                                    {merchant_name}
                                </p>
                                <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                                    Powered by ReturnGuard · Intelligent Return Protection
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
    {headline}

    Hi {customer_name},

    {subheadline}

    Return Request ID: #{return_id}
    Order Number: {order_number}
    Status: {status_title}
    Reason: {reason_label}
    Refund Mode: {refund_method_label}
    Amount: {order_total}

    {instructions_title}
    {decision_notes or 'Please check your account portal for latest updates.'}

    View your return status at:
    {orders_url}

    — {merchant_name} via ReturnGuard
    """

    return html_content, plain_text, subject

