# School and district import

In the platform Admin dashboard, open **Schools → Bulk Upload**.

1. Select **Districts**, download the CSV template, and fill in a unique `code` and `name` for each district. Contact and address columns are optional.
2. Choose the file and review the server preview. No records are saved during preview. Confirm to import the valid rows.
3. Select **Schools**, download its template, and fill in `name`, `code` and `districtCode`. Use an existing district code from **Available district codes**. Import districts first.
4. Review the row numbers and issues, then choose **Confirm import of valid rows**. Invalid rows are skipped and reported.
5. Download the error report if needed. Correct failed rows in the original template and upload only those rows again. The report's `row` and `error` columns are for diagnosis and are not import columns.

Limits: 500 records, 512 KB per file. UTF-8 CSV supports quoted commas, escaped quotes and multiline fields. School names/codes are checked without case sensitivity; district codes are normalized to uppercase. Existing records are reported as duplicates and never overwritten. Commit repeats validation because records can change after preview. A lost response requires another preview before retrying.

Existing schools can be assigned to a district using **Edit School → District**. Older schools remain valid without a district. The import does not create or reassign accounts, classes, teachers or parent–child relationships. Parent, Student and Teacher guides display the school and district linked to their account; account assignments are managed separately.

## API

`POST /api/v1/school/import` requires an authenticated platform `admin`. School `administrator`, teacher, student and parent accounts cannot import.

```json
{
  "kind": "districts",
  "commit": false,
  "csv": "name,code\nNorth District,NORTH"
}
```

Use `kind: "schools"` with school columns. `commit: false` previews and `commit: true` creates valid records. The response's `data` contains `rows` with physical CSV line numbers, field values, status (`ready`, `created`, `error`) and optional error, plus `total`, `ready`, `created` and `failed` counts.

`GET /api/v1/school/districts` lists district names/codes for `admin` and `administrator`. School create/update accepts an existing district ObjectId in `districtId`; school read responses populate its name and code. No existing data migration is required. Build and deploy the backend together with the dashboard and mobile changes.
