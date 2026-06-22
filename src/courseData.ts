import type { Course } from "./types";

const generalSubjects = [
  "English Language",
  "Mathematics",
  "General Paper / Current Affairs",
];

const groups: Array<[string, string[], string[]]> = [
  [
    "Faculty of Clinical Sciences",
    ["Medicine and Surgery", "Nursing", "Dentistry", "Physiotherapy", "Medical Laboratory Science", "Radiography", "Pharmacology", "Physiology"],
    ["English Language", "Biology", "Chemistry", "Physics"],
  ],
  ["Faculty of Pharmacy", ["Pharmacy"], ["English Language", "Biology", "Chemistry", "Physics"]],
  [
    "Faculty of Engineering",
    ["Civil Engineering", "Mechanical Engineering", "Electrical and Electronics Engineering", "Computer Engineering", "Chemical Engineering", "Petroleum and Gas Engineering", "Systems Engineering", "Metallurgical and Materials Engineering", "Surveying and Geoinformatics"],
    ["English Language", "Mathematics", "Physics", "Chemistry"],
  ],
  [
    "Faculty of Science",
    ["Computer Science", "Information Technology", "Data Science", "Cybersecurity"],
    ["English Language", "Mathematics", "Physics", "Chemistry"],
  ],
  ["Faculty of Law", ["Law"], ["English Language", "Literature-in-English", "Government", "CRS / IRS / Economics"]],
  [
    "Faculty of Management Sciences",
    ["Accounting", "Finance", "Business Administration", "Industrial Relations and Personnel Management", "Insurance", "Actuarial Science"],
    ["English Language", "Mathematics", "Economics", "Government / Commerce / Accounting"],
  ],
  [
    "Faculty of Social Sciences",
    ["Economics", "Political Science", "Psychology", "Sociology", "Social Work", "Geography", "Mass Communication"],
    ["English Language", "Mathematics", "Economics", "Government"],
  ],
  [
    "Faculty of Arts",
    ["English", "History and Strategic Studies", "Creative Arts", "Philosophy", "Linguistics", "European Languages", "Yoruba", "Igbo", "Chinese Studies", "Religious Studies"],
    ["English Language", "Literature-in-English", "Government", "CRS / IRS / History"],
  ],
  ["Faculty of Environmental Sciences", ["Architecture", "Estate Management"], ["English Language", "Mathematics", "Physics", "Geography"]],
];

const slugify = (name: string) => name.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-");

export const fallbackCourses: Course[] = groups
  .flatMap(([faculty, names, utmeSubjects]) =>
    names.map((name) => ({
      id: slugify(name),
      name,
      faculty,
      utme_subjects: utmeSubjects,
      final_test_subjects: [...new Set([...generalSubjects, ...utmeSubjects])],
    })),
  )
  .sort((a, b) => a.name.localeCompare(b.name));

