const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const xlsx = require("xlsx");

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

const databaseDir = path.join(__dirname, "database");
const pdfDir = path.join(databaseDir, "pdf");
const csvPath = path.join(databaseDir, "database.csv");
const excelFile = "會員資料template.xlsx";
const excelPath = path.join(__dirname, excelFile);

if (!fs.existsSync(databaseDir)) fs.mkdirSync(databaseDir, { recursive: true });
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

const CSV_COLUMNS = [
  { key: "entryMode", label: "表單模式" },
  { key: "memberType", label: "會員類別" },
  { key: "familyMemberSubtype", label: "家庭會員類別" },
  { key: "memberNumber", label: "會員編號", aliases: ["會員號碼"] },
  { key: "chineseName", label: "中文姓名" },
  { key: "englishName", label: "英文姓名" },
  { key: "gender", label: "性別" },
  { key: "birthDate", label: "出生日期" },
  { key: "idNumber", label: "身份證號碼" },
  { key: "phone", label: "電話" },
  { key: "homePhone", label: "住宅電話" },
  { key: "address", label: "地址" },
  { key: "maritalStatus", label: "婚姻狀況" },
  { key: "spouseName", label: "配偶姓名" },
  { key: "childrenLivingTogether", label: "是否有子女同住" },
  { key: "childrenNames", label: "子女姓名" },
  { key: "education", label: "教育程度" },
  { key: "professionalSkills", label: "專業技能" },
  { key: "occupation", label: "職業" },
  { key: "employmentStatus", label: "就業情況", aliases: ["工作狀況"] },
  { key: "employmentType", label: "工作類型" },
  { key: "monthlySalary", label: "每月工資", aliases: ["每月薪金"] },
  { key: "householdSize", label: "家庭人數", aliases: ["家庭總人數"] },
  { key: "householdIncome", label: "家庭每月總收入" },
  { key: "housingStatus", label: "居住狀況", aliases: ["住屋性質"] },
  { key: "housingStatusOther", label: "居住狀況(其他)", aliases: ["住屋性質(其他)"] },
  { key: "monthlyHousingExpense", label: "每月住屋開支" },
  { key: "receivingAssistance", label: "接受政府援助", aliases: ["是否領取援助"] },
  { key: "assistanceTypes", label: "援助類型" },
  { key: "assistanceOther", label: "援助類型(其他)" },
  { key: "staffOwner", label: "負責同事" },
  { key: "staffOwnerOther", label: "負責同事(其他)" },
  { key: "staffRemarks", label: "備註" },
  { key: "signatureDate", label: "簽署日期" },
  { key: "agreeToTerms", label: "同意聲明" },
];

const COL = {
  memberNumber: 1,
  chineseName: 3,
  englishName: 4,
  gender: 5,
  phone: 6,
  birthDate: 9,
  idNumber: 11,
  address: 13,
  education: 14,
  occupation: 15,
  employmentStatus: 17,
  monthlySalary: 18,
  householdIncome: 19,
  housingStatus: 20,
  monthlyHousingExpense: 22,
  householdSize: 23,
  receivingAssistance: 26,
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, pdfDir),
  filename: (_req, file, cb) => {
    const incoming = file.originalname || `application-${Date.now()}.pdf`;
    const ext = path.extname(incoming).toLowerCase() || ".pdf";
    const base = path
      .basename(incoming, ext)
      .replace(/[^A-Za-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "");
    const safeBase = base || `application-${Date.now()}`;
    cb(null, `${safeBase}${ext === ".pdf" ? ext : ".pdf"}`);
  },
});
const upload = multer({ storage });

const normalizeIdNumber = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "")
    .replace(/[()]/g, "");

const normalizeMemberNumber = (value) => String(value || "").trim().toUpperCase();
const normalizeName = (value) => String(value || "").trim();

const extractSelectionCode = (value) => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "number") return String(value).padStart(2, "0");
  const match = String(value).trim().match(/^(\d{1,2})/);
  return match ? match[1].padStart(2, "0") : "";
};

const mapGender = (value) => {
  const v = String(value || "").trim().toUpperCase();
  if (v === "M") return "male";
  if (v === "F") return "female";
  return "";
};

const mapReceivingAssistance = (value) => {
  const text = String(value || "").trim();
  if (!text) return "";
  if (["否", "沒有", "NO", "N"].includes(text.toUpperCase())) return "no";
  if (["是", "有", "YES", "Y"].includes(text.toUpperCase())) return "yes";
  if (text.includes("否") || text.includes("沒有") || text.toLowerCase() === "no") return "no";
  if (text.includes("是") || text.includes("有") || text.toLowerCase() === "yes") return "yes";
  return "";
};

const toPlainString = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\.0$/, "");
};

const formatDateToYMD = (value) => {
  if (value === undefined || value === null || value === "") return "";
  
  let date;
  if (typeof value === 'number') {
    // Excel numeric date: days since 1899-12-30
    date = new Date(Math.round((value - 25569) * 86400 * 1000));
  } else if (value instanceof Date) {
    date = value;
  } else {
    date = new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "";
  // If it's a string from CSV, we should also try to treat it as UTC if it's just a date
  if (typeof value === "string" && !value.includes("T")) {
    const [y, m, d] = value.split("-");
    if (y && m && d) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseMemberNumber = (value) => {
  const text = normalizeMemberNumber(value);
  const match = text.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return { prefix: match[1], number: Number(match[2]) };
};

const getMemberTypeFromNumber = (memberNumber) => {
  const text = normalizeMemberNumber(memberNumber);
  if (text.startsWith("G")) return { memberType: "general", familyMemberSubtype: "" };
  if (text.startsWith("E")) return { memberType: "elderly", familyMemberSubtype: "" };
  if (text.startsWith("PC")) return { memberType: "family", familyMemberSubtype: "PC" };
  if (text.startsWith("PS")) return { memberType: "family", familyMemberSubtype: "PS" };
  if (text.startsWith("P")) return { memberType: "family", familyMemberSubtype: "P" };
  return { memberType: "general", familyMemberSubtype: "" };
};

const loadRows = () => {
  if (!fs.existsSync(excelPath)) {
    console.error(`[Excel] File not found: ${excelPath}`);
    return [];
  }
  try {
    const workbook = xlsx.readFile(excelPath, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    console.log(`[Excel] Loaded ${rows.length} rows from ${excelFile}`);
    const dataRows = rows.slice(1).filter((row) => row.some((cell) => cell !== ""));
    console.log(`[Excel] First 5 member numbers: ${dataRows.slice(0, 5).map(r => r[COL.memberNumber]).join(", ")}`);
    const p713sCheck = dataRows.find(r => normalizeMemberNumber(r[COL.memberNumber]) === "P713S");
    if (p713sCheck) {
      console.log(`[Excel] DEBUG: P713S found in dataRows at index ${dataRows.indexOf(p713sCheck)}`);
    } else {
      console.log(`[Excel] DEBUG: P713S NOT found in dataRows!`);
    }
    return dataRows;
  } catch (err) {
    console.error(`[Excel] Error reading ${excelFile}:`, err);
    return [];
  }
};

const rowToFormData = (row) => {
  const memberNumber = toPlainString(row[COL.memberNumber]);
  const memberTypeInfo = getMemberTypeFromNumber(memberNumber);
  return {
    entryMode: "lookup",
    originalMemberNumber: memberNumber,
    memberType: memberTypeInfo.memberType,
    familyMemberSubtype: memberTypeInfo.familyMemberSubtype,
    memberNumber,
    chineseName: toPlainString(row[COL.chineseName]),
    englishName: toPlainString(row[COL.englishName]),
    gender: mapGender(row[COL.gender]),
    birthDate: formatDateToYMD(row[COL.birthDate]),
    idNumber: toPlainString(row[COL.idNumber]),
    phone: toPlainString(row[COL.phone]),
    address: toPlainString(row[COL.address]),
    maritalStatus: "",
    spouseName: "",
    childrenLivingTogether: "",
    childrenNames: [],
    education: extractSelectionCode(row[COL.education]),
    professionalSkills: "",
    occupation: toPlainString(row[COL.occupation]),
    employmentStatus: extractSelectionCode(row[COL.employmentStatus]),
    employmentType: "",
    monthlySalary: toPlainString(row[COL.monthlySalary]),
    householdSize: toPlainString(row[COL.householdSize]),
    householdIncome: toPlainString(row[COL.householdIncome]),
    housingStatus: extractSelectionCode(row[COL.housingStatus]),
    housingStatusOther: "",
    monthlyHousingExpense: toPlainString(row[COL.monthlyHousingExpense]),
    receivingAssistance: mapReceivingAssistance(row[COL.receivingAssistance]),
    assistanceTypes: [],
    assistanceOther: "",
    signature: "",
    signatureDate: new Date().toISOString().split("T")[0],
    agreeToTerms: false,
  };
};

const parseCsvLine = (line) => {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current);
  return cells;
};

const escapeCsvValue = (value) => {
  const text = Array.isArray(value) ? value.join(";") : String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
};

const readCsvMatrix = () => {
  if (!fs.existsSync(csvPath)) return [];
  const raw = fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, "").trim();
  if (!raw) return [];
  return raw.split(/\r?\n/).map(parseCsvLine);
};

const writeCsvRecords = (records) => {
  const header = CSV_COLUMNS.map((column) => column.label);
  const lines = [
    header.map(escapeCsvValue).join(","),
    ...records.map((record) =>
      CSV_COLUMNS.map((column) => escapeCsvValue(record[column.key] ?? "")).join(",")
    ),
  ];
  fs.writeFileSync(csvPath, `\uFEFF${lines.join("\n")}\n`, "utf8");
};

const createEmptyRecord = () =>
  CSV_COLUMNS.reduce((acc, column) => {
    acc[column.key] = "";
    return acc;
  }, {});

const findHeaderIndex = (headers, column) => {
  const candidates = [column.label, ...(column.aliases || [])];
  return headers.findIndex((header) => candidates.includes(header));
};

const recordsFromMatrix = (matrix) => {
  if (matrix.length === 0) return [];
  const headers = matrix[0];

  return matrix.slice(1).map((row) => {
    const record = createEmptyRecord();
    CSV_COLUMNS.forEach((column) => {
      const index = findHeaderIndex(headers, column);
      if (index >= 0) {
        record[column.key] = row[index] ?? "";
      }
    });
    return record;
  });
};

const ensureCsvSchema = () => {
  if (!fs.existsSync(csvPath) || fs.statSync(csvPath).size === 0) {
    writeCsvRecords([]);
    return;
  }

  const matrix = readCsvMatrix();
  if (matrix.length === 0) {
    writeCsvRecords([]);
    return;
  }

  const currentHeaders = matrix[0];
  const targetHeaders = CSV_COLUMNS.map((column) => column.label);
  const exactMatch =
    currentHeaders.length === targetHeaders.length &&
    currentHeaders.every((header, index) => header === targetHeaders[index]);

  if (!exactMatch) {
    const records = recordsFromMatrix(matrix);
    writeCsvRecords(records);
  }
};

const readSavedEntries = () => {
  ensureCsvSchema();
  const matrix = readCsvMatrix();
  const records = recordsFromMatrix(matrix);

  return records.map((record) => ({
    ...record,
    childrenNames:
      typeof record.childrenNames === "string"
        ? record.childrenNames
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(record.childrenNames)
        ? record.childrenNames
        : [],
    assistanceTypes:
      typeof record.assistanceTypes === "string"
        ? record.assistanceTypes
            .split(";")
            .map((s) => s.trim())
            .filter(Boolean)
        : Array.isArray(record.assistanceTypes)
        ? record.assistanceTypes
        : [],
    agreeToTerms: record.agreeToTerms === "true",
  }));
};

const getNextMemberNumber = (prefix) => {
  const entries = readSavedEntries();
  let maxNumber = 0;

  entries.forEach((entry) => {
    const parsed = parseMemberNumber(entry.memberNumber);
    if (!parsed || parsed.prefix !== prefix) return;
    if (parsed.number > maxNumber) maxNumber = parsed.number;
  });

  return `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
};

const idNumberExists = (idNumber, entryMode, originalMemberNumber) => {
  const normalizedId = normalizeIdNumber(idNumber);
  if (!normalizedId) return false;

  // If we are updating an existing member, we skip their own ID check
  // but for lookup mode, we might want to allow updating the same record.
  // Actually, the current system always appends to CSV.
  // If it's a new registration (apply mode), we should check for duplicates.
  if (entryMode === "apply") {
    return readSavedEntries().some(
      (entry) => normalizeIdNumber(entry.idNumber) === normalizedId
    );
  }
  return false;
};

const memberNumberExists = (memberNumber, entryMode, originalMemberNumber) => {
  const normalizedMemberNumber = normalizeMemberNumber(memberNumber);
  const normalizedOriginal = normalizeMemberNumber(originalMemberNumber);

  if (!normalizedMemberNumber) return false;
  if (entryMode === "lookup" && normalizedOriginal && normalizedMemberNumber === normalizedOriginal) {
    return false;
  }

  return readSavedEntries().some(
    (entry) => normalizeMemberNumber(entry.memberNumber) === normalizedMemberNumber
  );
};

const spouseNameExists = (spouseName) => {
  const normalized = normalizeName(spouseName);
  if (!normalized) return false;

  return readSavedEntries().some(
    (entry) => normalizeName(entry.chineseName) === normalized
  );
};

const buildRecordFromFormData = (formData) => ({
  entryMode: formData.entryMode || "apply",
  memberType: formData.memberType || "",
  familyMemberSubtype: formData.familyMemberSubtype || "",
  memberNumber: normalizeMemberNumber(formData.memberNumber),
  chineseName: normalizeName(formData.chineseName),
  englishName: normalizeName(formData.englishName),
  gender: formData.gender || "",
  birthDate: formData.birthDate || "",
  idNumber: normalizeName(formData.idNumber),
  phone: normalizeName(formData.phone),
  homePhone: normalizeName(formData.homePhone),
  address: normalizeName(formData.address),
  maritalStatus: formData.maritalStatus || "",
  spouseName: normalizeName(formData.spouseName),
  childrenLivingTogether: formData.childrenLivingTogether || "",
  childrenNames: Array.isArray(formData.childrenNames)
    ? formData.childrenNames.map((name) => normalizeName(name)).filter(Boolean)
    : [],
  education: formData.education || "",
  professionalSkills: normalizeName(formData.professionalSkills),
  occupation: normalizeName(formData.occupation),
  employmentStatus: formData.employmentStatus || "",
  employmentType: formData.employmentType || "",
  monthlySalary: formData.monthlySalary || "",
  householdSize: formData.householdSize || "",
  householdIncome: formData.householdIncome || "",
  housingStatus: formData.housingStatus || "",
  housingStatusOther: normalizeName(formData.housingStatusOther),
  monthlyHousingExpense: formData.monthlyHousingExpense || "",
  receivingAssistance: formData.receivingAssistance || "",
  assistanceTypes: Array.isArray(formData.assistanceTypes) ? formData.assistanceTypes : [],
  assistanceOther: normalizeName(formData.assistanceOther),
  staffOwner: formData.staffOwner || "",
  staffOwnerOther: normalizeName(formData.staffOwnerOther),
  staffRemarks: normalizeName(formData.staffRemarks),
  signatureDate: formData.signatureDate || "",
  agreeToTerms: String(Boolean(formData.agreeToTerms)),
});

app.get("/", (_req, res) => {
  res.send("Backend server is running! API endpoints: /api/lookup-member, /api/next-member-number, /api/check-spouse-name, /api/submit-form, /api/save-pdf");
});

app.post("/api/lookup-member", (req, res) => {
  const { idNumber, memberNumber } = req.body || {};
  const normalizedId = normalizeIdNumber(idNumber);
  const normalizedMember = normalizeMemberNumber(memberNumber);

  console.log(`[Lookup] Request received - idNumber: "${idNumber}" (norm: "${normalizedId}"), memberNumber: "${memberNumber}" (norm: "${normalizedMember}")`);

  if (!normalizedId && !normalizedMember) {
    console.warn("[Lookup] Missing search criteria");
    return res.status(400).json({ error: "Missing search criteria (idNumber or memberNumber)" });
  }

  try {
    // 1. Check CSV first (latest data)
    console.log("[Lookup] Checking CSV database...");
    const csvEntries = readSavedEntries();
    const csvMatch = csvEntries.find(entry => {
      const entryId = normalizeIdNumber(entry.idNumber);
      const entryMember = normalizeMemberNumber(entry.memberNumber);
      
      if (normalizedId && entryId === normalizedId) {
        console.log(`[Lookup] CSV match found by ID: ${entry.memberNumber}`);
        return true;
      }
      if (normalizedMember && entryMember === normalizedMember) {
        console.log(`[Lookup] CSV match found by Member Number: ${entry.memberNumber}`);
        return true;
      }
      return false;
    });

    if (csvMatch) {
      return res.status(200).json({ data: csvMatch });
    }

    // 2. Check template Excel file
    console.log(`[Lookup] Checking Excel file: ${excelFile}...`);
    const rows = loadRows();
    const match = rows.find((row, index) => {
      const rowId = normalizeIdNumber(row[COL.idNumber]);
      const rowMember = normalizeMemberNumber(row[COL.memberNumber]);

      // Debug: Log the first few rows and every 100th row to see what's being scanned
      if (index < 5 || index % 500 === 0) {
        // console.log(`[Lookup] Scanning row ${index + 2}: Member="${rowMember}", ID="${rowId}"`);
      }

      if (normalizedId && rowId === normalizedId) {
        console.log(`[Lookup] Excel match found by ID at row ${index + 2}: ${rowMember}`);
        return true;
      }
      if (normalizedMember && rowMember === normalizedMember) {
        console.log(`[Lookup] Excel match found by Member Number at row ${index + 2}: ${rowMember}`);
        return true;
      }
      return false;
    });

    if (match) {
      return res.status(200).json({ data: rowToFormData(match) });
    }

    console.log("[Lookup] No match found in CSV or Excel");
    return res.status(404).json({ error: "Member not found" });
  } catch (error) {
    console.error("[Lookup] Error during lookup:", error);
    return res.status(500).json({ error: "Failed to read member data" });
  }
});

app.get("/api/next-member-number", (req, res) => {
  const prefix = normalizeMemberNumber(req.query?.prefix);
  if (!prefix) {
    return res.status(400).json({ error: "Missing prefix" });
  }

  try {
    return res.status(200).json({ memberNumber: getNextMemberNumber(prefix) });
  } catch (error) {
    console.error("Error calculating next member number:", error);
    return res.status(500).json({ error: "Failed to calculate next member number" });
  }
});

app.post("/api/check-spouse-name", (req, res) => {
  const spouseName = normalizeName(req.body?.spouseName);
  if (!spouseName) {
    return res.status(400).json({ error: "Missing spouseName" });
  }

  try {
    return res.status(200).json({ match: spouseNameExists(spouseName) });
  } catch (error) {
    console.error("Error checking spouse name:", error);
    return res.status(500).json({ error: "Failed to check spouse name" });
  }
});

const checkDuplicateIdInternal = (idNumber, memberNumber) => {
  const normalizedId = normalizeIdNumber(idNumber);
  console.log(`[DuplicateCheck] Checking ID: ${idNumber} (Normalized: ${normalizedId}) for Member: ${memberNumber}`);
  
  if (!normalizedId) {
    console.log(`[DuplicateCheck] No normalized ID, skipping check.`);
    return null;
  }

  const normCurrentMember = normalizeMemberNumber(memberNumber);

  // Check CSV
  const csvEntries = readSavedEntries();
  console.log(`[DuplicateCheck] Checking CSV (${csvEntries.length} entries)...`);
  const csvDuplicate = csvEntries.find(entry => {
    const entryId = normalizeIdNumber(entry.idNumber);
    const idMatches = entryId === normalizedId;
    
    if (idMatches) {
      console.log(`[DuplicateCheck] CSV Match Found: ID=${entryId}, Member=${entry.memberNumber}`);
    }
    
    return idMatches;
  });
  
  if (csvDuplicate) {
    console.log(`[DuplicateCheck] BLOCKED by CSV: ${csvDuplicate.memberNumber}`);
    return { 
      source: "CSV", 
      memberNumber: csvDuplicate.memberNumber,
      chineseName: csvDuplicate.chineseName 
    };
  }

  // Check Excel
  const rows = loadRows();
  console.log(`[DuplicateCheck] Checking Excel (${rows.length} rows)...`);
  const excelDuplicate = rows.find(row => {
    const rowId = normalizeIdNumber(row[COL.idNumber]);
    const rowMember = normalizeMemberNumber(row[COL.memberNumber]);
    const idMatches = rowId === normalizedId;
    const memberDiffers = rowMember !== normCurrentMember;

    if (idMatches) {
      console.log(`[DuplicateCheck] Excel Match Found: ID=${rowId}, Member=${rowMember}. Differ? ${memberDiffers}`);
    }

    // For Excel (original database), we only block if it's a DIFFERENT member number
    // because if it's the same member, we are likely just importing/updating them.
    // However, if the user wants to stop ALL duplicates, we might need to reconsider.
    // Given the request "stop if found duplicate", let's be strict.
    return idMatches && memberDiffers;
  });

  if (excelDuplicate) {
    console.log(`[DuplicateCheck] BLOCKED by Excel: ${toPlainString(excelDuplicate[COL.memberNumber])}`);
    return { 
      source: "Excel", 
      memberNumber: toPlainString(excelDuplicate[COL.memberNumber]),
      chineseName: toPlainString(excelDuplicate[COL.chineseName])
    };
  }

  console.log(`[DuplicateCheck] No duplicates found.`);
  return null;
};

app.post("/api/check-duplicate-id", (req, res) => {
  const idNumber = req.body?.idNumber;
  const memberNumber = req.body?.memberNumber;

  try {
    const duplicate = checkDuplicateIdInternal(idNumber, memberNumber);
    if (duplicate) {
      return res.status(200).json({ 
        exists: true, 
        ...duplicate
      });
    }
    return res.status(200).json({ exists: false });
  } catch (error) {
    console.error("Error checking duplicate ID:", error);
    return res.status(500).json({ error: "Failed to check duplicate ID" });
  }
});

app.post("/api/submit-form", (req, res) => {
  const formData = req.body || {};

  try {
    ensureCsvSchema();

    if (
      memberNumberExists(
        formData.memberNumber,
        formData.entryMode,
        formData.originalMemberNumber
      )
    ) {
      return res.status(409).json({ error: "Duplicate member number" });
    }

    const existingRecords = readSavedEntries();
    const newRecord = buildRecordFromFormData(formData);
    writeCsvRecords([...existingRecords, newRecord]);

    return res.status(200).json({ message: "Form data saved successfully" });
  } catch (error) {
    console.error("Error saving CSV:", error);
    return res.status(500).json({ error: "Failed to save form data" });
  }
});

app.post("/api/save-pdf", upload.single("pdf"), (req, res) => {
  console.log(`[PDF Upload] Received request for ${req.file?.originalname || "unknown file"}`);
  if (!req.file) {
    console.error("[PDF Upload] Error: No file uploaded");
    return res.status(400).json({ error: "No PDF file uploaded" });
  }
  console.log(`[PDF Upload] Success: Saved to ${req.file.path}`);
  return res.status(200).json({
    message: "PDF saved successfully",
    filename: req.file.filename,
    path: req.file.path,
  });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend server running at http://localhost:${port}`);
});
