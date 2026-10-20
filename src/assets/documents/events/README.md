# Event documents

PDFs offered on an event page — parking permits, maps, programmes.

To publish the October 22 parking permit:

1. Save the PDF here as `october-22-2026-parking-permit.pdf`
2. In `src/_data/events.json`, on the `october-22-2026` entry, set
   `venue.permit` to `/assets/documents/events/october-22-2026-parking-permit.pdf`

The Print and Download buttons appear automatically once that value is set;
while it is null the card shows "Permit PDF — coming shortly" instead.
