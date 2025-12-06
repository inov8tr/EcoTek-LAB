import bcrypt from "bcryptjs";

const input = process.argv[2];
if (!input) {
  console.error("Usage: npm run hash-password -- <plain-text>");
  process.exit(1);
}

const hash = await bcrypt.hash(input, 12);
console.log(hash);
