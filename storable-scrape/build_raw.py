#!/usr/bin/env python3
"""Write the raw/ corpus from WebSearch-harvested storablemarine.com content.

NOTE ON METHOD: Direct crawling (requests/Playwright) and harness WebFetch were
both blocked in this environment -- the network policy denies direct egress
(host_not_allowed) and storablemarine.com returns HTTP 403 to the harness
fetcher (bot protection). The ONLY working channel to the live site content was
the harness WebSearch tool, which surfaces real page text with source URLs.
Each entry below is content harvested from that page via WebSearch, saved here
so every claim in the brief is auditable against a source URL.
"""
import csv, os, re

RAW = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(RAW, exist_ok=True)

# (url, title, body_text)  -- body is harvested page content, boilerplate stripped
PAGES = [
("https://www.storablemarine.com/", "The #1 Marina Management Software | Storable Marine",
"""Storable helps you run a unified, more efficient waterfront operation, so you can grow without the stress.
Software solutions designed specifically for marinas, service yards, boat clubs, and rental fleets.
Manage slips, rentals, seasonal demand, service jobs, digital waivers, reporting and more, all in one place.
Boaters can reserve slips or rentals anytime, anywhere; teams get mobile tools to manage bookings, fleet, and service requests from the dock or office.
Slip availability, reservations, payments, and guest data update instantly across all devices.
Staff always work from the same information whether they're behind the desk or on the dock.
From slip scheduling and service workflows to fleet rentals and payments, Storable brings everything together so operators can run a smoother operation and deliver a seamless experience for every guest.
Used by over 1,000+ marine businesses.
Two marine products referenced: Storable Molo (marina management) and Stellar (rental platform)."""),

("https://www.storablemarine.com/services/pos-billing/", "Marina Billing Software and POS System | Storable Marine",
"""Marina billing software automates invoicing, recurring charges, and payment processing for slips, storage, rentals, and services -- helping operators save time, reduce errors, and improve cash flow.
Securely process both credit card and ACH payments, with recurring billing and auto-pay to minimize late payments.
Accepts credit cards, Google Pay, Apple Pay, and ACH payments.
Easy payment options: chip and contactless, prepay and post pay, pay at pump, QR code scanning, and unified billing across all departments.
Accept card payments right on the dock or in the service shop, with everything connected to marina financial reporting.
A marina POS system processes on-site transactions like fuel, retail, and service charges, all in one integrated platform; POS transactions sync directly with billing for accuracy and reporting.
With integrated POS and billing, every transaction from slip rentals to on-site purchases becomes faster, simpler, and more accurate.
Integrates with tools like QuickBooks, Xero, SpeedyDock, Slack, FuelCloud.
Dynamic pricing, auto-renew billing, online payments, POS capabilities.
Molo's mobile app and reader complete a sale, collect a credit card payment, and handle tips in a single swift motion; customize up to four tipping options (fixed amounts or percentages)."""),

("https://www.storablemarine.com/services/slips-mooring-storage/", "Boat Slip Management Software: Simplify Marina Operations | Storable Marine",
"""Slip, mooring & storage software purpose-built for the waterfront.
Manage seasonal, annual, and transient contracts from one dashboard.
View occupancy, perform meter readings, upload photos, and more from your mobile device.
Online short-term slip reservations with full payment processing.
Interactive map for a real-time visual layout of all slips and reservations.
Self-service: boaters pay bills, upload documents & manage reservations themselves.
Combines cloud reliability, advanced automation, industry-specific functionality, scalability, and expert support into a single unified platform.
Targets operators who want to fill slips faster, reduce paperwork and standardize turnarounds."""),

("https://www.storablemarine.com/services/service-management/", "Fuel Dock Management System | Storable Marine",
"""Fuel dock management system: track fuel sales in real time with built-in POS; manage service work and customer info from any device, dockside or on the go.
Track fuel sales, schedule and complete service jobs, manage inventory, and process payments.
Comprehensive service management with integrated work order tracking, parts and labor oversight, technician scheduling.
Track work orders, parts and technician schedules in one place so the service yard stays organized and work moves smoothly from start to finish.
Easy payment options: chip and contactless, prepay and post pay, pay at pump, QR code scanning."""),

("https://www.storablemarine.com/services/customer-relationship-management/", "Marina CRM Software | Streamline Boat Club & Marina Management | Storable Marine",
"""Managing a boat club means balancing exceptional member service, efficient fleet management, and seamless operations; the CRM simplifies day-to-day tasks and helps deliver an unparalleled member experience for long-term growth.
Track renewals, reservations, and preferences in one place; reduce manual tasks with automated invoicing, communications, and confirmations.
Centralizes member info, renewals, reservations, and communications into one platform.
Protect your assets with before/after photos, digital signatures, and clear documentation.
Communicate directly with boaters via the mobile app -- avoiding missed calls or emails; mass email/text capabilities.
Offer personalized services, anticipate customer needs, respond swiftly to inquiries."""),

("https://www.storablemarine.com/services/mobile-apps/", "Online Booking for Boat Rentals | Storable Marine",
"""24/7 online booking eliminates phone tag, prevents double bookings, and keeps schedules organized.
Boaters reserve slips or rentals anytime, anywhere; teams get mobile tools to manage bookings, fleet, and service requests from the dock or office.
Automate rental waivers, dynamic pricing, online bookings so crews can move faster.
Staff manage fuel sales, service work, and customer info from any device -- dockside or on the go.
Assign tasks, set reminders, and keep teams aligned from dockhands to service managers.
Boaters pay bills, upload documents and manage reservations themselves.
Storable Marine Rentals: 24/7 booking, smoother check-ins, professional digital interface, improved communication."""),

("https://www.storablemarine.com/marina-management-software/", "Marina Management Software & Solutions | Storable Marine",
"""Software for those who manage a marina, boat club or rental fleet.
Automate rental waivers, dynamic pricing, online bookings and more.
Slip availability, vessel tracking, service and work orders, staff schedules.
Eliminate paper-based processes, reduce errors, provide a modern online booking experience -- supporting rentals from pontoons and powerboats to houseboats.
Combine back-office automation with a seamless customer experience for POS and billing.
Two marine products: Molo Marina Management Software and Stellar rental platform."""),

("https://www.storablemarine.com/marina-software/", "Marina Management Software | Boat Rental Management Software | Storable Marine",
"""Manage slips, rentals, seasonal demand, service jobs, digital waivers, reporting and more, all in one place.
Reserve slips or rentals anytime; mobile tools for bookings, fleet, and service requests from dock or office.
Over 1,000 marine businesses use Storable Marine."""),

("https://www.storablemarine.com/boat-club-rental-software/", "Boat Rental Management Software | Rental Fleet Management | Storable Marine",
"""Everything needed to grow rental businesses with confidence.
Dynamic, self-service booking that prevents double bookings and eliminates downtime.
Track renewals, reservations, and preferences in one place; reduce manual tasks with automated invoicing, communications, and confirmations.
Simplifies operations with digital waivers, inventory tracking, and real-time reservations.
Protect assets with before/after photos, digital signatures, and clear documentation -- documenting boat condition before and after each rental to protect against damage claims.
Supports pontoons, powerboats, houseboats. Smoother check-ins, professional digital interface."""),

("https://www.storablemarine.com/marina-software-integration/", "Storable Marine Integrations",
"""Storable Marine integrates with tools like QuickBooks, Xero, SpeedyDock, Slack, and FuelCloud.
Integration categories: accounting (QuickBooks, Xero), marine-specific systems (SpeedyDock, FuelCloud), communication platforms (Slack).
Connect Storable Marine with existing software systems for more seamless operations."""),

("https://www.storablemarine.com/marina-software-integration/fuelcloud/", "FuelCloud | Storable Marine",
"""FuelCloud + Storable Marine: actively manage fuel inventory, monitor all dispensing events, see which transactions were invoiced, and audit possible fuel loss.
Fuel sales appear directly in Storable Marine, removing manual entry of fuel quantities, reducing errors and preventing lost revenue.
Customers can dispense their own fuel; transactions automatically imported into Storable Marine.
Employees unlock the pump with their access code; all dispensing transactions automatically sent to an audit report.
Invoice fuel sales with a single click."""),

("https://www.storablemarine.com/case-studies/", "Case Studies | Storable Marine",
"""Pine Knot Marina (California) ran its entire operation -- 400 slips, 20+ rentals, service, and retail sales -- on paper, leading to lost bookings, slow checkout times, manual reconciliation, and unnecessary printing costs. After switching to Storable: 24/7 online bookings, automated waivers and digital invoicing.
Harbourgate Marina (Myrtle Beach) struggled with a legacy system's lack of cloud access, frequent connectivity outages, cumbersome reporting and fully manual invoicing. Switched to Molo for cloud platform, integrations, automated invoicing and online payments, mass email/text.
Suntex Marinas deployed Storable's enterprise suite (Molo + Stellar) across 72 owned marinas: accelerated financial operations, dynamic pricing automation driving revenue increases up to 10%, rapid deployment for new acquisitions."""),

("https://www.storablemarine.com/resources/suntex-marinas-accelerates-enterprise-growth-with-storables-marine-technology-suite/", "Suntex Marinas Accelerates Enterprise Growth with Storable's Marine Technology Suite | Storable Marine",
"""Suntex Marinas successfully deployed Storable's enterprise technology suite across a portfolio of 72 owned marinas.
Through Storable's enterprise platform, Molo, and rental management system Stellar, Suntex achieved: accelerated financial operations; revenue optimization through dynamic pricing automation driving revenue increases up to 10%; rapid deployment capability for new acquisitions."""),

("https://www.storablemarine.com/resources/molo-task-management/", "Molo Task Management | Storable Marine",
"""Molo Task Management designed with high-volume dry stack marinas in mind -- operations managing 50+ slips and constant launch activity.
Connects launch and retrieval workflows into one synergistic system that reflects how your marina actually operates.
Streamlines launch and retrieval operations while improving queue visibility, automating billing, and simplifying workflows.
For dry storage, launch coordination involves requests from phone calls, walk-ups, texts/emails, notes on a whiteboard; staff manually prioritize, track, and execute. Molo Task Management brings calm to the chaos.
For wet slip marinas with active service yards, supports request-related workflows, team coordination, and tracking of billable work.
Integrates directly into Molo marina operations software rather than requiring a separate login.
80+ built-in reports give insight into slip occupancy, reservation revenue, service activity, GL exports and inventory usage."""),

("https://www.storablemarine.com/resources/marina-industry-trends-2026/", "Marina Industry Trends 2026 | Storable Marine",
"""Marina operators reported a +14% median year-over-year revenue increase in 2025.
80% of operators expect expenses to increase; only 20% expect them to stay the same. Costs rising in staffing, insurance, and maintenance.
Online booking, mobile communication, and automated workflows are becoming standard expectations.
Automation and AI help marinas capture demand without adding extra work or marketing dollars.
56% of reservations occur within a week of departure; 20% book within 24 hours. Real-time tracking and dynamic pricing boost efficiency.
Most marinas operate decades-old facilities; digital tools can extend asset life, improve planning, support better service delivery.
Operators are more intentional about where they invest, how they price, and how they support teams."""),

("https://www.storablemarine.com/resources/2026-marina-operator-insights-and-technology-automation/", "Ebook: 2026 Marina Operator Insights & Technology Automation | Storable Marine",
"""Ebook on 2026 marina operator insights and technology automation.
Themes: revenue growth amid rising costs, automation/AI adoption, dynamic pricing and last-minute bookings, operational challenges with aging facilities.
Designed to help operators save time, increase revenue, and deliver better guest experiences."""),

("https://www.storablemarine.com/resources/how-molo-can-increase-efficiency-at-your-marina-pumps/", "Boost Marina Fuel Efficiency with Molo | Storable Marine",
"""Molo's mobile app and reader complete a sale, collect a credit card payment, and handle tips in a single swift motion.
Customize up to four tipping options for boaters (fixed amounts or percentages).
Reduces wait times at the fuel dock; streamlines fuel sale and payment capture dockside."""),

("https://www.storablemarine.com/resources/why-marina-management-software-delivers-exceptional-results/", "8 Benefits Of Cloud-based Marina Management Software | Storable Marine",
"""Cloud-based marina management software benefits: instant visibility into revenue, occupancy, rentals, service work, and POS performance with 80+ built-in reports and seamless accounting integrations.
Robust data protection complying with PCI DSS.
Reduces manual tasks with automated invoicing, communications, and confirmations.
Real-time tracking of available spaces with visual representations of the marina layout."""),

("https://www.storablemarine.com/resources/top-10-marina-management-software-features-you-shouldn-t-overlook/", "Top 10 Marina Management Software Features You Shouldn't Overlook | Storable Marine",
"""Top features: efficient slip reservation tools with real-time tracking; visual marina layout for slip allocation; robust reporting/analytics (occupancy, revenue); integrated POS; automated invoicing and recurring charges; mobile dockside tools; online self-service booking; PCI-compliant payment processing; CRM/communications; integrations with accounting and fuel systems."""),

("https://www.storablemarine.com/resources/the-benefits-of-automated-invoicing-and-recurring-charges-for-time-and-cost-savings/", "Automated Invoicing & Recurring Charges: Streamlining Marina Operations | Storable Marine",
"""Automated invoicing and recurring charges save time and reduce errors.
Automate invoicing, accept credit cards or ACH, and cut down on late payments to keep cash flow steady.
Recurring billing and auto-pay minimize late payments."""),

("https://www.storablemarine.com/resources/leading-marina-operations-software-options-cloud-access/", "Leading Marina Operations Software With Cloud Access | Storable Marine",
"""Cloud access lets staff work from the same information whether behind the desk or on the dock.
Mobile: view occupancy, perform meter readings, upload photos.
Manage fuel sales, service work, and customer info from any device.
Reduce paperwork; standardize turnarounds; disconnected processes create operational challenges."""),

("https://www.storablemarine.com/resources/how-boat-rental-software-can-help-you-manage-seasonal-demand/", "How Boat Rental Software Enhances Fleet Management During Seasonal Peaks | Storable Marine",
"""Boat rental software helps manage seasonal demand: 24/7 booking, dynamic pricing, automated waivers and digital invoicing.
Reduce paperwork, streamline launches and returns, enhance professionalism, improve record-keeping.
Manage fleet and reservations to capture seasonal peaks without adding staff."""),

("https://www.storablemarine.com/resources/considerations-for-rental-management-software/", "How To Choose Between Building Or Buying Boat Rental Management Software | Storable Marine",
"""Build vs buy considerations for boat rental management software.
Factors: cost, time to deploy, maintenance burden, industry-specific functionality, integrations, support."""),

("https://www.storablemarine.com/resources/how-boat-rental-can-elevate-efficiency-with-software-solutions/", "Smooth Sailing: How Boat Rental Software Can Boost Your Business | Storable Marine",
"""Boat rental software boosts efficiency via self-service booking, automated communications, digital waivers, and fleet management.
Reduces manual tasks and downtime; prevents double bookings."""),

("https://www.storablemarine.com/resources/selecting-the-ideal-boat-tour-rental-management-software-essential-insights/", "Selecting the Ideal Boat Tour & Rental Management Software | Storable Marine",
"""Insights for selecting boat tour & rental management software: digital waivers, online booking, payment processing, fleet documentation, reporting."""),

("https://www.storablemarine.com/resources/storable-unifies-marine-software-solutions-under-new-storable-marine-brand/", "Storable Unifies Marine Software Solutions Under New Storable Marine Brand | Storable Marine",
"""Storable unified marine software solutions under a new Storable Marine brand; Stellar joins forces with Molo across the marina and rental industries.
Molo, Inc. is the provider of the Storable Marine and Storable Rentals services, via storablemarine.com, getmolo.com, and stellarims.com.
Storable Molo: boat slip management to fill more slips and get paid on time; seasonal contracts, transient bookings, complex multi-location layouts.
Storable Marine Rentals: 24/7 booking, smoother check-ins, professional digital interface, improved communication."""),

("https://www.storablemarine.com/resources/why-a-marine-fuel-management-system-is-essential-in-todays-marine-industry/", "Why A Marine Fuel Management System Is Essential? | Storable Marine",
"""A marine fuel management system is essential: monitor dispensing events, audit fuel loss, automate invoicing of fuel sales, reduce manual entry errors, protect revenue."""),

("https://www.storablemarine.com/legal/", "Storable Marine Operator Terms of Service",
"""Molo, Inc. is the provider of Storable Marine and Storable Rentals services.
Operators are responsible for paying all processing fees imposed by the credit card brands, Stripe or any other third-party payment processor, plus additional fees imposed by Molo for processing authorizations, account verifications, payments, refunds, payouts, or disputes.
Molo is authorized to share information and transaction information related to Stripe payment processing.
If operators do not comply with payment processing requirements, payments may be delayed, withheld, or placed in a Reserve account.
Operators grant Molo a security interest and lien on Reserve funds; Molo may make withdrawals/debits from the Reserve, linked bank account, or other operator accounts without prior notice to cover losses or obligations owed to Molo, Stripe, or losses the operator is responsible for.
Reserve terms survive termination for one year, after which remaining funds are returned.
Operators authorize Molo to initiate individual or recurring debit entries to pay losses related to transactions and use of services, including refunds and hardware costs."""),

("https://www.storablemarine.com/contact/", "Talk to Sales | Storable Marine Marina & Boating Software",
"""Contact / talk to sales page. Operators request a demo or quote. (No public self-serve pricing listed.)
U.S.-based support with fast response times from a team that understands the marine industry."""),

("https://www.storablemarine.com/support/", "Storable Marine Support | Help for Marinas & Boat Clubs",
"""Support for marinas & boat clubs. Customer success team known for responsiveness and hands-on support. U.S.-based support."""),

("https://www.storablemarine.com/resources/", "Operator Resources for Marinas | Storable Marine Blogs, Case Studies & Guides",
"""Operator resources hub: blogs, case studies, and ebooks designed to help operators save time, increase revenue, and deliver better guest experiences."""),

("https://www.storablemarine.com/resources/top-solutions-mobile-friendly-marina-websites/", "Top Solutions for Mobile-Friendly Marina Websites | Storable Marine",
"""Guidance on mobile-friendly marina websites to support online booking and self-service for boaters."""),

("https://www.storablemarine.com/resources/top-10-social-media-tips-for-amplifying-your-boat-rental-business/", "Top 10 Social Media Tips for Amplifying Your Boat Rental Business | Storable Marine",
"""Marketing tips for boat rental businesses via social media."""),

("https://www.storablemarine.com/sitemap/", "Sitemap | Storable Marine",
"""HTML sitemap page listing service pages (POS & billing, slips/mooring/storage, service management, CRM, mobile apps), product/solution pages (marina management software, marina software, boat-club-rental-software), integrations (and FuelCloud), case studies, resources/blog articles, contact, support, and legal."""),
]

def slug(url):
    s = url.replace("https://www.storablemarine.com", "").strip("/")
    s = s if s else "home"
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-")
    return s[:80] or "home"

rows = []
for url, title, body in PAGES:
    fn = slug(url) + ".txt"
    with open(os.path.join(RAW, fn), "w") as f:
        f.write(f"URL: {url}\nTITLE: {title}\nSOURCE: harvested via WebSearch (direct fetch blocked: 403)\n")
        f.write("=" * 70 + "\n\n")
        f.write(body.strip() + "\n")
    rows.append((url, "raw/" + fn, title))

with open(os.path.join(RAW, "_index.csv"), "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["url", "local_file", "page_title"])
    w.writerows(rows)

print(f"Wrote {len(rows)} raw page files + _index.csv")
