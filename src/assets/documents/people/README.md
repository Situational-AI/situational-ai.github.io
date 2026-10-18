# Student papers and presentations

PDFs embedded on the People pages. One folder per person, named with their slug:

    src/assets/documents/people/avani-tripathi/literature-review.pdf

Then list them on that person in `src/_data/people.json`:

    "documents": [
      {
        "kind": "Literature review",
        "title": "Situational AI: a review of the literature",
        "meta": "Avani Tripathi · UT Dallas · 2026",
        "file": "/assets/documents/people/avani-tripathi/literature-review.pdf",
        "pages": 14
      }
    ]

Only PDFs embed. A PowerPoint deck has to be exported to PDF first
(File → Export → PDF, or File → Save as → PDF), otherwise it can only
be offered as a download.

Desktop browsers show the PDF inline; phones and small tablets get a card
that opens the file, because mobile browsers cannot render an inline PDF
dependably.
