#!/usr/bin/env python3
"""Generate docs/SilkviewConnect_MSCert_Notes.pdf from structured content."""

from __future__ import annotations

from pathlib import Path

from fpdf import FPDF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "SilkviewConnect_MSCert_Notes.pdf"

FOOTER = (
    "Silkview Connect - Microsoft AppSource Certification Notes - "
    "Confidential - Not for customer distribution"
)


def ascii_safe(text: str) -> str:
    return (
        text.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2192", "->")
        .replace("\u2191", "^")
        .replace("\u2026", "...")
    )


class CertPDF(FPDF):
    def footer(self) -> None:
        self.set_y(-14)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(120, 120, 120)
        self.cell(0, 4, FOOTER, align="C")
        self.ln(3)
        self.cell(0, 4, f"Page {self.page_no()}", align="C")


def section_title(pdf: CertPDF, num: str, title: str) -> None:
    pdf.set_font("Helvetica", "B", 11)
    pdf.set_text_color(30, 64, 175)
    pdf.cell(12, 7, num)
    pdf.set_text_color(0, 0, 0)
    pdf.cell(0, 7, ascii_safe(title), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)


def h2(pdf: CertPDF, text: str) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "B", 10)
    pdf.multi_cell(0, 5, ascii_safe(text))
    pdf.ln(1)


def body(pdf: CertPDF, text: str) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "", 9)
    pdf.multi_cell(0, 4.5, ascii_safe(text))
    pdf.ln(1)


def note(pdf: CertPDF, text: str) -> None:
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "I", 8.5)
    pdf.set_text_color(60, 60, 60)
    pdf.multi_cell(0, 4, ascii_safe(f"i  {text}"))
    pdf.set_text_color(0, 0, 0)
    pdf.ln(1)


def table(pdf: CertPDF, headers: list[str], rows: list[list[str]], col_widths: list[int]) -> None:
    pdf.set_font("Helvetica", "B", 8)
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 6, ascii_safe(h), border=1)
    pdf.ln()
    pdf.set_font("Helvetica", "", 8)
    for row in rows:
        line_h = 5
        x0 = pdf.get_x()
        y0 = pdf.get_y()
        heights: list[float] = []
        for i, cell in enumerate(row):
            pdf.set_xy(x0 + sum(col_widths[:i]), y0)
            pdf.multi_cell(col_widths[i], line_h, ascii_safe(cell), border=0)
            heights.append(pdf.get_y() - y0)
        row_h = max(heights) if heights else line_h
        for i, cell in enumerate(row):
            pdf.set_xy(x0 + sum(col_widths[:i]), y0)
            pdf.multi_cell(col_widths[i], line_h, ascii_safe(cell), border=1)
        pdf.set_xy(x0, y0 + row_h)
    pdf.set_x(pdf.l_margin)
    pdf.ln(2)


def build_pdf() -> None:
    pdf = CertPDF()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(18, 18, 18)

    # Cover block
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 10, "Silkview Connect", new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(
        0,
        7,
        "Microsoft AppSource - Certification Testing Notes",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(
        0,
        6,
        "Excel add-in - Stripe to Xero reconciliation",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.cell(
        0,
        6,
        "Version: 1.0 beta | Date: June 2026 | Publisher: Silkview Systems | Category: Accounting & Finance",
        new_x="LMARGIN",
        new_y="NEXT",
    )
    pdf.ln(4)

    section_title(pdf, "01", "Add-in overview")
    h2(pdf, "What Silkview Connect does")
    body(
        pdf,
        "Silkview Connect is a Microsoft Excel add-in (Office JS task pane) that automates "
        "reconciliation of Stripe payment data into Xero. It connects Stripe and Xero via OAuth 2.0, "
        "pulls Stripe balance transactions into Excel worksheets, builds Xero-ready manual journal "
        "and bank transaction rows using formula-driven account mappings, and pushes those entries "
        "to Xero via the Xero Accounting API — all from within the Excel task pane.",
    )
    table(
        pdf,
        ["Field", "Value"],
        [
            ["Add-in name", "Silkview Connect"],
            ["Manifest ID", "6f4b82d9-1c5a-4b3d-9e28-7a1c5d9f3e4b"],
            ["Task pane URL", "https://addin.silkview.org/taskpane.html"],
            ["Host application", "Microsoft Excel (desktop and web)"],
            ["Min Office version", "Excel 2016 / Office 365"],
            ["External services", "Xero Accounting API, Stripe API"],
            ["Authentication", "OAuth 2.0 - Xero and Stripe, browser popup flow"],
            [
                "Data storage",
                "Workbook: pulled/built data in Excel. Server: OAuth tokens encrypted until disconnect.",
            ],
            ["Plans", "Free (100 rows/pull, no Xero push), Pro, Firm"],
        ],
        [42, 148],
    )

    section_title(pdf, "02", "Test accounts for certification")
    note(
        pdf,
        "Use these credentials to validate the complete workflow. Xero Demo Company (AU) — sandbox only.",
    )
    h2(pdf, "Silkview Connect account (add-in login)")
    table(
        pdf,
        ["Field", "Value"],
        [
            ["Email", "testsilkviewconnect@gmail.com"],
            ["Password", "CertReview2026!"],
            ["Plan", "Pro - all features unlocked"],
            ["Workspace", "Cert Review Workspace (pre-configured)"],
        ],
        [42, 148],
    )
    h2(pdf, "Xero login credentials & organisation")
    table(
        pdf,
        ["Field", "Value"],
        [
            ["Xero username", "testsilkviewconnect@gmail.com"],
            ["Xero password", "CertReview2026!"],
            ["Organisation", "Demo Company (AU)"],
            ["Base currency", "AUD"],
            ["Connection", "OAuth 2.0 - token auto-refreshes"],
            [
                "Access level",
                "Read accounts, tax, contacts, reports. Write journals and bank transactions.",
            ],
        ],
        [42, 148],
    )
    h2(pdf, "Stripe — test mode account")
    table(
        pdf,
        ["Field", "Value"],
        [
            ["Account", "Pre-connected - TEST badge (orange) in task pane"],
            ["Mode", "TEST"],
            ["Available data", "30 days: charges, refunds, fees, payouts"],
        ],
        [42, 148],
    )

    pdf.add_page()
    section_title(pdf, "03", "Permissions and data access")
    h2(pdf, "Xero OAuth 2.0 scopes")
    table(
        pdf,
        ["Scope", "Type", "Purpose"],
        [
            ["accounting.transactions", "Read+Write", "Post manual journals and bank transactions"],
            ["accounting.settings", "Read", "Chart of accounts, tax rates, tracking"],
            ["accounting.reports.read", "Read", "Organisation/report context"],
            ["accounting.contacts", "Read", "Contacts for bank transaction mapping"],
            ["offline_access", "System", "Token refresh"],
        ],
        [58, 22, 110],
    )
    note(
        pdf,
        "NOT requested: openid/profile/email, payroll, asset/file scopes, or write to Xero settings.",
    )
    h2(pdf, "Stripe OAuth scope")
    table(
        pdf,
        ["Scope", "Type", "Purpose"],
        [
            [
                "read_write",
                "Read (Connect)",
                "Pull balance transactions, payouts, charges. No charge creation or fund movement.",
            ],
        ],
        [28, 28, 134],
    )
    h2(pdf, "Office JS permission")
    body(
        pdf,
        "Manifest declares ReadWriteDocument. Required to create worksheets and write data. "
        "No other host permissions declared.",
    )

    section_title(pdf, "04", "Step-by-step testing workflow")
    note(
        pdf,
        "Connections active on cert workspace. Configure Account_Mappings (Step 5) after pull and before Build.",
    )
    for title, steps in [
        (
            "Step 1 - Sign in",
            [
                "Insert > My Add-ins > Silkview Connect.",
                "Click Sign in -> www.silkview.org/auth/login -> cert credentials.",
                "Select Cert Review Workspace in the dropdown.",
            ],
        ),
        (
            "Step 2 - Verify connections",
            [
                "Xero card: Demo Company (AU), green dot, AUD.",
                "Stripe card: TEST badge; account ticked under Accounts for pull.",
                "Reconnect: button on connection card. Disconnect: www.silkview.org/dashboard.",
            ],
        ),
        (
            "Step 3 - Setup sheets",
            [
                "Quick setup > Setup sheets -> 7 worksheets.",
                "Quick setup > Refresh Xero -> Account_Mappings dropdowns.",
            ],
        ),
        (
            "Step 4 - Pull",
            [
                "Pull tab: Balance Transactions, 30-day range, Pull to sheet.",
                "Stripe_Balance_Transactions: 13 columns A–M, headers row 1.",
            ],
        ),
        (
            "Step 5 - Configure Account_Mappings",
            [
                "Open Account_Mappings sheet (after Refresh Xero in Step 3).",
                "charge, refund, fee: Xero Account 200 - Sales; Tax Type OUTPUT - GST on Income.",
                "stripe_clearing: 855 - Clearing Account. stripe_payout_bank: 090 - Business Bank Account.",
                "Contact Mapping: Bank Transfer Contact -> Bank. Save workbook before Build.",
            ],
        ),
        (
            "Step 6 - Build",
            [
                "Build tab > Build journals from balance transactions -> Xero_Journals.",
                "Optional: Build bank transactions -> Xero_Bank_Transaction.",
                "Gross Amount column; balance validated on push.",
            ],
        ),
        (
            "Step 7 - Push",
            [
                "Push tab: Manual journals or Bank transactions segment.",
                "Journals: range, Status Draft/Posted, Push journals to Xero button.",
                "Writeback: Xero ID col I, Status col J. Verify in Xero Manual Journals.",
            ],
        ),
    ]:
        h2(pdf, title)
        for i, step in enumerate(steps, 1):
            pdf.set_x(pdf.l_margin)
            pdf.set_font("Helvetica", "", 9)
            pdf.multi_cell(0, 4.5, ascii_safe(f"{i}. {step}"))
        pdf.ln(1)

    pdf.add_page()
    section_title(pdf, "05", "Expected outcomes")
    table(
        pdf,
        ["Step", "Action", "Pass criteria"],
        [
            ["Sign in", "Sign in", "Workspace selector after auth"],
            ["Connect", "Xero card", "Org + AUD, no error"],
            ["Connect", "Stripe card", "TEST badge, account for pull"],
            ["Setup", "Setup sheets", "All 7 sheet tabs"],
            ["Setup", "Refresh Xero", "Account code dropdowns col B"],
            ["Pull", "Balance Transactions", "Rows > 0, 13 cols A-M"],
            [
                "Mappings",
                "Account_Mappings",
                "200-Sales/GST; 855 clearing; 090 bank; Bank contact",
            ],
            ["Build", "Journals", "Xero_Journals with Gross Amount"],
            ["Build", "Bank txs", "Xero_Bank_Transaction payout rows"],
            ["Push", "Journals", "Xero IDs col I; Status DRAFT/POSTED"],
            ["Push", "Bank txs", "IDs and status on bank sheet"],
        ],
        [22, 48, 120],
    )

    section_title(pdf, "06", "Network calls and data handling")
    table(
        pdf,
        ["Domain", "Purpose", "Auth"],
        [
            ["addin.silkview.org", "Task pane UI + API proxy", "Session handoff"],
            ["www.silkview.org", "Auth, dashboard, REST API", "HttpOnly cookie"],
            ["api.xero.com", "Xero Accounting API", "OAuth Bearer (brokered)"],
            ["api.stripe.com", "Stripe API reads", "Connect OAuth (brokered)"],
        ],
        [48, 72, 70],
    )
    note(
        pdf,
        "OAuth tokens server-side only (encrypted). Not returned to Excel. Workbook holds pulled/built data.",
    )

    section_title(pdf, "07", "Support and contact information")
    table(
        pdf,
        ["Item", "URL"],
        [
            ["Publisher", "Silkview Systems"],
            ["Support", "https://www.silkview.org/support"],
            ["Privacy", "https://www.silkview.org/privacy"],
            ["Terms", "https://www.silkview.org/terms"],
            ["Manifest URL", "https://www.silkview.org/api/addin/manifest"],
        ],
        [42, 148],
    )
    note(
        pdf,
        "Cert account has Pro access. Report locked features via support URL with error details.",
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    pdf.output(str(OUT))
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    build_pdf()
