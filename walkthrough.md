# Phil-Apex — Complete Sample Data Reference
*(Start from a clean slate. Enter everything in this exact order.)*

---

## Stage 0: Staff / Team Setup

*Staff Portal → Team (sidebar). Admin logs in first, then creates the two staff accounts below.*

### Admin Account *(already exists — log in with this)*
| Field | Value |
|---|---|
| Email | admin@phil-apex.com |
| Role | Administrator |

---

### Create Staff Member 1
*Staff Portal → Team → + Add Staff Member*
| Field | Value |
|---|---|
| Full Name | Ana Reyes |
| Email | ana.reyes@phil-apex.com |
| Temporary Password | PhilApex2026! |
| Role | Front Desk |

---

### Create Staff Member 2
*Staff Portal → Team → + Add Staff Member*
| Field | Value |
|---|---|
| Full Name | Carlo Delos Santos |
| Email | carlo.delos@phil-apex.com |
| Temporary Password | PhilApex2026! |
| Role | Processing Officer |

---

## Stage 1: Trades Setup

*Staff Portal → System Settings (Partners page) → Trades section → + Add Trade*

Add the following trades one by one:
1. `Fish Processing`
2. `Welder`
3. `Steelman`
4. `Laundry/Linen Supply`
5. `Machine Operator`
6. `Caregiver`
7. `Construction Worker`

---

## Stage 2: Programs Setup

*Staff Portal → System Settings → Programs section → + Add Program*

### Program 1
| Field | Value |
|---|---|
| Program Name | TITP |
| Country | Japan |
| Duration (years) | 3 |

### Program 2
| Field | Value |
|---|---|
| Program Name | SSW |
| Country | Japan |
| Duration (years) | 5 |

### Program 3
| Field | Value |
|---|---|
| Program Name | Nurse Visa |
| Country | Czech Republic |
| Duration (years) | *(leave blank)* |

---

## Stage 3: Foreign Partners Setup

*Staff Portal → System Settings → Partners section → + Add Partner*

Add in this order (top-level first, then children).

### Partner 1 — KJH *(Supervising Org, top level)*
| Field | Value |
|---|---|
| Name | KJH |
| Type of Organization | Supervising Organization |
| Is Final Employer? | *(unchecked)* |
| Parent Partner | None (Top Level Organization) |
| Program | TITP — Japan |
| Contact Person | Kenji Tanaka |
| Contact Email | kenji@kjh.co.jp |

### Partner 2 — Shihoku *(Implementing Org under KJH)*
| Field | Value |
|---|---|
| Name | Shihoku |
| Type of Organization | Implementing Organization |
| Is Final Employer? | ✅ Checked |
| Parent Partner | KJH |
| Program | TITP — Japan |
| Contact Person | Hiroshi Shima |
| Contact Email | h.shima@shihoku.jp |

### Partner 3 — KK Company A *(Implementing Org under KJH)*
| Field | Value |
|---|---|
| Name | KK Company A |
| Type of Organization | Implementing Organization |
| Is Final Employer? | ✅ Checked |
| Parent Partner | KJH |
| Program | TITP — Japan |
| Contact Person | Takashi Kuroda |
| Contact Email | t.kuroda@kk-a.jp |

### Partner 4 — Egston *(Direct Employer, top level)*
| Field | Value |
|---|---|
| Name | Egston |
| Type of Organization | Direct Employer |
| Is Final Employer? | ✅ Checked |
| Parent Partner | None (Top Level Organization) |
| Program | Nurse Visa — Czech Republic |
| Contact Person | Jan Novak |
| Contact Email | j.novak@egston.cz |

---

## Stage 4: Accreditations Setup

*Staff Portal → Accreditations → + Add Accreditation*

### Accreditation 1
| Field | Value |
|---|---|
| DMW Ref ID | DMW-2024-KJH-001 |
| Principal Partner | KJH |
| Processing Unit | Processing Unit A |
| Representative | Kenji Tanaka |
| Date Issued | 2024-01-15 |
| Date Expiration | 2026-12-31 |
| Status | Active |

### Accreditation 2
| Field | Value |
|---|---|
| DMW Ref ID | DMW-2024-EGS-001 |
| Principal Partner | Egston |
| Processing Unit | Processing Unit B |
| Representative | Jan Novak |
| Date Issued | 2024-06-01 |
| Date Expiration | 2027-05-31 |
| Status | Active |

---

## Stage 5: Job Orders

*Staff Portal → Job Orders → + New Job Order*

### Job Order 1
| Field | Value |
|---|---|
| JO Number | JO-2026-101 |
| Class | Direct |
| Slots Required | 25 |
| Validity Date | 2027-02-28 |
| Accreditation | DMW-2024-KJH-001 |
| Company | KK Company A |
| Program | TITP |
| Trade / Position | Fish Processing |
| Gender Requirement | Any Gender |

### Job Order 2
| Field | Value |
|---|---|
| JO Number | JO-2026-102 |
| Class | Additional |
| Slots Required | 15 |
| Validity Date | 2026-12-31 |
| Accreditation | DMW-2024-KJH-001 |
| Company | Shihoku |
| Program | TITP |
| Trade / Position | Welder |
| Gender Requirement | Male |

### Job Order 3
| Field | Value |
|---|---|
| JO Number | JO-2026-103 |
| Class | Direct |
| Slots Required | 10 |
| Validity Date | 2027-04-15 |
| Accreditation | DMW-2024-KJH-001 |
| Company | KK Company A |
| Program | TITP |
| Trade / Position | Laundry/Linen Supply |
| Gender Requirement | Female |

### Job Order 4
| Field | Value |
|---|---|
| JO Number | JO-2026-104 |
| Class | Direct |
| Slots Required | 20 |
| Validity Date | 2027-06-30 |
| Accreditation | DMW-2024-EGS-001 |
| Company | Egston |
| Program | Nurse Visa |
| Trade / Position | Caregiver |
| Gender Requirement | Any Gender |

---

## Stage 6: Public Registration

*Open Incognito Window → go to `http://localhost:3000/register` for each applicant.*

---

### Applicant 1 — Maria Santos
| Field | Value |
|---|---|
| Full Name | Maria Santos |
| Date of Birth | 1990-03-15 |
| Gender | Female |
| Cellphone | 09171234561 |
| Email | maria.santos@example.com |
| Home Address | 45 Rizal Street, Bacolod City, Negros Occidental |
| Educational Attainment | College Graduate |
| How did you find us? | Walk-in |
| Preferred Trade / Position | Fish Processing |
| Has Passport? | Yes |

---

### Applicant 2 — Juan Dela Cruz
| Field | Value |
|---|---|
| Full Name | Juan Dela Cruz |
| Date of Birth | 1995-07-20 |
| Gender | Male |
| Cellphone | 09181234562 |
| Email | juan.delacruz@example.com |
| Home Address | 12 Magsaysay Avenue, Bacolod City, Negros Occidental |
| Educational Attainment | High School Graduate |
| How did you find us? | Job Fair |
| Preferred Trade / Position | Welder |
| Has Passport? | Yes |

---

### Applicant 3 — Ramon Bautista
| Field | Value |
|---|---|
| Full Name | Ramon Bautista |
| Date of Birth | 1988-11-05 |
| Gender | Male |
| Cellphone | 09191234563 |
| Email | ramon.bautista@example.com |
| Home Address | 78 Lacson Street, Bacolod City, Negros Occidental |
| Educational Attainment | High School Graduate |
| How did you find us? | Walk-in |
| Preferred Trade / Position | Steelman |
| Has Passport? | **No** |

---

### Applicant 4 — Angelica Reyes
| Field | Value |
|---|---|
| Full Name | Angelica Reyes |
| Date of Birth | 1993-05-12 |
| Gender | Female |
| Cellphone | 09201234564 |
| Email | angelica.reyes@example.com |
| Home Address | 23 Araneta Street, Bacolod City, Negros Occidental |
| Educational Attainment | College Graduate |
| How did you find us? | LGU/PESO |
| Preferred Trade / Position | Caregiver |
| Has Passport? | Yes |

---

### Applicant 5 — Kristina Morales *(goes all the way to Deployed)*
| Field | Value |
|---|---|
| Full Name | Kristina Morales |
| Date of Birth | 1997-08-30 |
| Gender | Female |
| Cellphone | 09211234565 |
| Email | kristina.morales@example.com |
| Home Address | 56 Lopez Jaena Street, Bacolod City, Negros Occidental |
| Educational Attainment | High School Graduate |
| How did you find us? | Job Fair |
| Preferred Trade / Position | Laundry/Linen Supply |
| Has Passport? | Yes |

---

## Stage 7: Document Verification

*Staff Portal → Applicants → click applicant → Documents tab → set each status.*

### Maria Santos — Fully Verified
| Document | Status |
|---|---|
| Japanese Resume | ✅ Verified |
| Colored Passport Copy w/ Signature | ✅ Verified |
| PSA Birth Certificate | ✅ Verified |
| Marriage Certificate | ❌ Missing |
| NBI Clearance | ✅ Verified |
| Police Clearance | ✅ Verified |
| Barangay Clearance | ✅ Verified |
| DMW E-Registration | ✅ Verified |
| PEOS Certificate | ✅ Verified |
| TESDA Certificate | ✅ Verified |
| Form 137/TOR | ✅ Verified |
| Diploma | ✅ Verified |
| ALS Docs | ❌ Missing |
| Letter of Recommendation | ✅ Verified |
| DTI/SEC/Mayor's Permit | ❌ Missing |
| IQ Test | ✅ Verified |
| Vaccination Certificate | ✅ Verified |
| 2x2 ID Photo | ✅ Verified |

### Juan Dela Cruz — Partial
| Document | Status |
|---|---|
| Japanese Resume | 📄 Submitted |
| Colored Passport Copy w/ Signature | ✅ Verified |
| PSA Birth Certificate | ✅ Verified |
| Marriage Certificate | ❌ Missing |
| NBI Clearance | 📄 Submitted |
| Police Clearance | ✅ Verified |
| Barangay Clearance | ✅ Verified |
| DMW E-Registration | ❌ Missing |
| PEOS Certificate | ❌ Missing |
| TESDA Certificate | 📄 Submitted |
| Form 137/TOR | ✅ Verified |
| Diploma | 📄 Submitted |
| ALS Docs | ❌ Missing |
| Letter of Recommendation | ❌ Missing |
| DTI/SEC/Mayor's Permit | ❌ Missing |
| IQ Test | ❌ Missing |
| Vaccination Certificate | 📄 Submitted |
| 2x2 ID Photo | ✅ Verified |

### Ramon Bautista — All Missing *(no passport, stuck)*
| Document | Status |
|---|---|
| All 18 documents | ❌ Missing |

### Angelica Reyes — Partial
| Document | Status |
|---|---|
| Japanese Resume | 📄 Submitted |
| Colored Passport Copy w/ Signature | ✅ Verified |
| PSA Birth Certificate | ✅ Verified |
| Marriage Certificate | ❌ Missing |
| NBI Clearance | ✅ Verified |
| Police Clearance | 📄 Submitted |
| Barangay Clearance | 📄 Submitted |
| DMW E-Registration | ✅ Verified |
| PEOS Certificate | ❌ Missing |
| TESDA Certificate | ✅ Verified |
| Form 137/TOR | 📄 Submitted |
| Diploma | ✅ Verified |
| ALS Docs | ❌ Missing |
| Letter of Recommendation | ❌ Missing |
| DTI/SEC/Mayor's Permit | ❌ Missing |
| IQ Test | 📄 Submitted |
| Vaccination Certificate | ✅ Verified |
| 2x2 ID Photo | ✅ Verified |

### Kristina Morales — Fully Verified *(going to Deployed)*
| Document | Status |
|---|---|
| Japanese Resume | ✅ Verified |
| Colored Passport Copy w/ Signature | ✅ Verified |
| PSA Birth Certificate | ✅ Verified |
| Marriage Certificate | ❌ Missing |
| NBI Clearance | ✅ Verified |
| Police Clearance | ✅ Verified |
| Barangay Clearance | ✅ Verified |
| DMW E-Registration | ✅ Verified |
| PEOS Certificate | ✅ Verified |
| TESDA Certificate | ✅ Verified |
| Form 137/TOR | ✅ Verified |
| Diploma | ✅ Verified |
| ALS Docs | ❌ Missing |
| Letter of Recommendation | ✅ Verified |
| DTI/SEC/Mayor's Permit | ❌ Missing |
| IQ Test | ✅ Verified |
| Vaccination Certificate | ✅ Verified |
| 2x2 ID Photo | ✅ Verified |

---

## Stage 8: Pipeline Stage Updates

*Staff Portal → Applicants → open applicant → Pipeline Stage dropdown → update.*

| Applicant | Target Stage | DMW Reg Number | PEOS Modules |
|---|---|---|---|
| Ramon Bautista | **Registered** *(no change)* | — | — |
| Juan Dela Cruz | **Documents Complete** | — | — |
| Angelica Reyes | **DMW Registered** | `DMW-2024-AR001` | — |
| Maria Santos | **PEOS Certified** | `DMW-2024-MS001` | **8** |
| Kristina Morales | **Matched** *(Deployed after batch)* | `DMW-2024-KM001` | **8** |

---

## Stage 9: Batches

*Staff Portal → Job Orders → click Manage on each JO → + Create Batch*

| Job Order | Batch Label |
|---|---|
| JO-2026-101 (Fish Processing — KK Company A) | `Batch 1 — Fish Processing Aug 2026` |
| JO-2026-102 (Welder — Shihoku) | `Batch 1 — Welders Aug 2026` |
| JO-2026-103 (Laundry — KK Company A) | `Batch 1 — Laundry Aug 2026` |
| JO-2026-104 (Caregiver — Egston) | `Batch 1 — Nurses Aug 2026` |

---

## Stage 10: Deployment — Kristina Morales

*Staff Portal → Job Orders → JO-2026-103 → Manage → Batch 1 — Laundry Aug 2026 → + Add Applicant*

| Field | Value |
|---|---|
| Applicant | Kristina Morales |
| Batch | Batch 1 — Laundry Aug 2026 |
| Hired Date | 2026-08-13 |
| Entry Date | 2026-09-01 |
| Document Status | Dispatched |
| Dispatched Date | 2026-08-25 |

*After saving: open Kristina's applicant profile → change Pipeline Stage to **Deployed**.*

---

## Final State Summary

| Applicant | Stage | Notes |
|---|---|---|
| Ramon Bautista | Registered | No passport |
| Juan Dela Cruz | Documents Complete | Partial docs |
| Angelica Reyes | DMW Registered | Mid-pipeline |
| Maria Santos | PEOS Certified | Fast-tracked |
| Kristina Morales | **Deployed** ✅ | Batch 1, Laundry JO |

---

## Stage 1: Public Registration

*Go to `http://localhost:3000/register` for each applicant. Fill in exactly as listed.*

---

### Applicant 1 — Maria Santos
| Field | Value |
|---|---|
| Full Name | Maria Santos |
| Date of Birth | 1990-03-15 |
| Gender | Female |
| Cellphone | 09171234561 |
| Email | maria.santos@example.com |
| Home Address | 45 Rizal Street, Bacolod City, Negros Occidental |
| Educational Attainment | College Graduate |
| How did you find us? | Walk-in |
| Preferred Trade / Position | Fish Processing |
| Has Passport? | Yes |

---

### Applicant 2 — Juan Dela Cruz
| Field | Value |
|---|---|
| Full Name | Juan Dela Cruz |
| Date of Birth | 1995-07-20 |
| Gender | Male |
| Cellphone | 09181234562 |
| Email | juan.delacruz@example.com |
| Home Address | 12 Magsaysay Avenue, Bacolod City, Negros Occidental |
| Educational Attainment | High School Graduate |
| How did you find us? | Job Fair |
| Preferred Trade / Position | Welder |
| Has Passport? | Yes |

---

### Applicant 3 — Ramon Bautista
| Field | Value |
|---|---|
| Full Name | Ramon Bautista |
| Date of Birth | 1988-11-05 |
| Gender | Male |
| Cellphone | 09191234563 |
| Email | ramon.bautista@example.com |
| Home Address | 78 Lacson Street, Bacolod City, Negros Occidental |
| Educational Attainment | High School Graduate |
| How did you find us? | Walk-in |
| Preferred Trade / Position | Steelman |
| Has Passport? | **No** |

---

### Applicant 4 — Angelica Reyes
| Field | Value |
|---|---|
| Full Name | Angelica Reyes |
| Date of Birth | 1993-05-12 |
| Gender | Female |
| Cellphone | 09201234564 |
| Email | angelica.reyes@example.com |
| Home Address | 23 Araneta Street, Bacolod City, Negros Occidental |
| Educational Attainment | College Graduate |
| How did you find us? | LGU/PESO |
| Preferred Trade / Position | Nurse |
| Has Passport? | Yes |

---

### Applicant 5 — Kristina Morales *(Full pipeline — reaches Deployed)*
| Field | Value |
|---|---|
| Full Name | Kristina Morales |
| Date of Birth | 1997-08-30 |
| Gender | Female |
| Cellphone | 09211234565 |
| Email | kristina.morales@example.com |
| Home Address | 56 Lopez Jaena Street, Bacolod City, Negros Occidental |
| Educational Attainment | High School Graduate |
| How did you find us? | Job Fair |
| Preferred Trade / Position | Laundry/Linen Supply |
| Has Passport? | Yes |

---

## Stage 2: Document Verification

*Staff portal → open each applicant → Documents tab → mark each document status.*

**Document list (18 items):**
1. Japanese Resume
2. Colored Passport Copy w/ Signature
3. PSA Birth Certificate
4. Marriage Certificate
5. NBI Clearance
6. Police Clearance
7. Barangay Clearance
8. DMW E-Registration
9. PEOS Certificate
10. TESDA Certificate
11. Form 137/TOR
12. Diploma
13. ALS Docs
14. Letter of Recommendation
15. DTI/SEC/Mayor's Permit
16. IQ Test
17. Vaccination Certificate
18. 2x2 ID Photo

---

### Maria Santos — Fully Verified
| Document | Status |
|---|---|
| Japanese Resume | ✅ Verified |
| Colored Passport Copy w/ Signature | ✅ Verified |
| PSA Birth Certificate | ✅ Verified |
| Marriage Certificate | Missing *(leave — conditional)* |
| NBI Clearance | ✅ Verified |
| Police Clearance | ✅ Verified |
| Barangay Clearance | ✅ Verified |
| DMW E-Registration | ✅ Verified |
| PEOS Certificate | ✅ Verified |
| TESDA Certificate | ✅ Verified |
| Form 137/TOR | ✅ Verified |
| Diploma | ✅ Verified |
| ALS Docs | Missing *(leave — conditional)* |
| Letter of Recommendation | ✅ Verified |
| DTI/SEC/Mayor's Permit | Missing |
| IQ Test | ✅ Verified |
| Vaccination Certificate | ✅ Verified |
| 2x2 ID Photo | ✅ Verified |

---

### Juan Dela Cruz — Partially Verified *(missing NBI and TESDA initially)*
| Document | Status |
|---|---|
| Japanese Resume | 📄 Submitted |
| Colored Passport Copy w/ Signature | ✅ Verified |
| PSA Birth Certificate | ✅ Verified |
| Marriage Certificate | Missing |
| NBI Clearance | 📄 Submitted *(returned later — then Verified)* |
| Police Clearance | ✅ Verified |
| Barangay Clearance | ✅ Verified |
| DMW E-Registration | Missing |
| PEOS Certificate | Missing |
| TESDA Certificate | 📄 Submitted *(returned later — then Verified)* |
| Form 137/TOR | ✅ Verified |
| Diploma | 📄 Submitted |
| ALS Docs | Missing |
| Letter of Recommendation | Missing |
| DTI/SEC/Mayor's Permit | Missing |
| IQ Test | Missing |
| Vaccination Certificate | 📄 Submitted |
| 2x2 ID Photo | ✅ Verified |

---

### Ramon Bautista — Nothing Done Yet *(no passport, stuck)*
| Document | Status |
|---|---|
| All 18 documents | ❌ Missing |

---

### Angelica Reyes — Partially Submitted
| Document | Status |
|---|---|
| Japanese Resume | 📄 Submitted |
| Colored Passport Copy w/ Signature | ✅ Verified |
| PSA Birth Certificate | ✅ Verified |
| Marriage Certificate | Missing |
| NBI Clearance | ✅ Verified |
| Police Clearance | 📄 Submitted |
| Barangay Clearance | 📄 Submitted |
| DMW E-Registration | ✅ Verified |
| PEOS Certificate | Missing |
| TESDA Certificate | ✅ Verified |
| Form 137/TOR | 📄 Submitted |
| Diploma | ✅ Verified |
| ALS Docs | Missing |
| Letter of Recommendation | Missing |
| DTI/SEC/Mayor's Permit | Missing |
| IQ Test | 📄 Submitted |
| Vaccination Certificate | ✅ Verified |
| 2x2 ID Photo | ✅ Verified |

---

### Kristina Morales — Fully Verified *(going to Deployed)*
| Document | Status |
|---|---|
| Japanese Resume | ✅ Verified |
| Colored Passport Copy w/ Signature | ✅ Verified |
| PSA Birth Certificate | ✅ Verified |
| Marriage Certificate | Missing *(leave — conditional)* |
| NBI Clearance | ✅ Verified |
| Police Clearance | ✅ Verified |
| Barangay Clearance | ✅ Verified |
| DMW E-Registration | ✅ Verified |
| PEOS Certificate | ✅ Verified |
| TESDA Certificate | ✅ Verified |
| Form 137/TOR | ✅ Verified |
| Diploma | ✅ Verified |
| ALS Docs | Missing *(leave — conditional)* |
| Letter of Recommendation | ✅ Verified |
| DTI/SEC/Mayor's Permit | Missing |
| IQ Test | ✅ Verified |
| Vaccination Certificate | ✅ Verified |
| 2x2 ID Photo | ✅ Verified |

---

## Stage 3: Pipeline Stage Updates

*Staff portal → open applicant → change Pipeline Stage dropdown → enter any additional fields shown.*

| Applicant | Target Stage | DMW Reg Number | PEOS Modules |
|---|---|---|---|
| Ramon Bautista | **Registered** *(no change — stuck, no passport)* | — | — |
| Juan Dela Cruz | **Documents Complete** | — | — |
| Angelica Reyes | **DMW Registered** | `DMW-2024-AR001` | — |
| Maria Santos | **PEOS Certified** | `DMW-2024-MS001` | **8** |
| Kristina Morales | **Matched** *(then Deployed after batch step)* | `DMW-2024-KM001` | **8** |

---

## Stage 4: Job Orders

*Staff portal → Job Orders → + New Job Order. Use these exact values.*

### Job Order 1
| Field | Value |
|---|---|
| JO Number | JO-2026-101 |
| Class | Direct |
| Slots Required | 25 |
| Validity Date | 2027-02-28 |
| Accreditation | DMW-2001 *(linked to KJH)* |
| Company | KK Company A |
| Program | TITP |
| Trade / Position | Fish Processing |
| Gender Requirement | Any Gender |

---

### Job Order 2
| Field | Value |
|---|---|
| JO Number | JO-2026-102 |
| Class | Additional |
| Slots Required | 15 |
| Validity Date | 2026-12-31 |
| Accreditation | DMW-2001 *(linked to KJH)* |
| Company | Shihoku |
| Program | TITP |
| Trade / Position | Welder |
| Gender Requirement | Male |

---

### Job Order 3
| Field | Value |
|---|---|
| JO Number | JO-2026-103 |
| Class | Direct |
| Slots Required | 10 |
| Validity Date | 2027-04-15 |
| Accreditation | DMW-2001 *(linked to KJH)* |
| Company | KK Company B |
| Program | TITP |
| Trade / Position | Laundry/Linen Supply |
| Gender Requirement | Female |

---

### Job Order 4
| Field | Value |
|---|---|
| JO Number | JO-2026-104 |
| Class | Direct |
| Slots Required | 20 |
| Validity Date | 2027-06-30 |
| Accreditation | DMW-1001 *(linked to Egston)* |
| Company | Egston |
| Program | Nurse Visa |
| Trade / Position | Nurse |
| Gender Requirement | Any Gender |

---

## Stage 5: Batches

*Staff portal → Job Orders → click Manage on each JO → + Create Batch.*

| Job Order | Batch Label |
|---|---|
| JO-2026-101 (Fish Processing — KK Company A) | `Batch 1 — Fish Processing Aug 2026` |
| JO-2026-102 (Welder — Shihoku) | `Batch 1 — Welders Aug 2026` |
| JO-2026-103 (Laundry — KK Company B) | `Batch 1 — Laundry Aug 2026` |
| JO-2026-104 (Nurse — Egston) | `Batch 1 — Nurses Aug 2026` |

---

## Stage 6: Deployment

*Applicant: Kristina Morales. Batch: Batch 1 — Laundry Aug 2026 (under JO-2026-103).*

*Staff portal → Job Orders → JO-2026-103 → Manage → Batch 1 → Add Applicant → select Kristina Morales.*

| Field | Value |
|---|---|
| Applicant | Kristina Morales |
| Batch | Batch 1 — Laundry Aug 2026 |
| Hired Date | 2026-08-13 |
| Entry Date | 2026-09-01 |
| Document Status | Dispatched |
| Dispatched Date | 2026-08-25 |

*After saving the deployment, open Kristina's applicant profile and change her Pipeline Stage to **Deployed**.*
