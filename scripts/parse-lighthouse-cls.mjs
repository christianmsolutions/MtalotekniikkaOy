#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const files = [
  'reports/lighthouse-home.json',
  'reports/lighthouse-home.www.json',
].filter((f) => existsSync(f));

if (!files.length) {
  console.error('No Lighthouse reports found.');
  process.exit(1);
}

const parseReport = (file) => {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const perf = json.categories?.performance?.score ?? null;
  const clsVal = json.audits?.['cumulative-layout-shift']?.numericValue ?? null;
  const shifts = json.audits?.['layout-shifts']?.details?.items ?? [];
  const shiftElems = json.audits?.['layout-shift-elements']?.details?.items ?? [];
  return { file, perf, clsVal, shifts, shiftElems };
};

const reports = files.map(parseReport);

for (const r of reports) {
  console.log(`\nReport: ${r.file}`);
  console.log(` Performance: ${r.perf !== null ? r.perf * 100 : 'n/a'}`);
  console.log(` CLS: ${r.clsVal !== null ? r.clsVal : 'n/a'}`);
  if (r.shiftElems?.length) {
    console.log(' Top layout-shift elements:');
    r.shiftElems.slice(0, 5).forEach((item, i) => {
      console.log(
        `  ${i + 1}. score=${item.score} selector=${item.node?.selector || '-'} nodeLabel=${item.node?.nodeLabel || ''}`,
      );
    });
  } else {
    console.log(' No layout-shift elements reported.');
  }
  if (r.shifts?.length) {
    console.log(' Layout shift entries:');
    r.shifts.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. scoreImpact=${item.scoreImpact} cumulativeScore=${item.cumulativeScore}`);
    });
  }
}

console.log('\nDone.');
