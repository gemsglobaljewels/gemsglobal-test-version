// One-shot: re-indent the style-row cells by 2 spaces so they sit inside the
// <tr> that moved into <Fragment>. Deletes itself after use (scratch/ is
// removed before any commit anyway).
const fs = require('fs')
const p = 'app/admin/styles/page.tsx'
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/)

const openIdx = lines.findIndex(l => l === '                      <tr>')
if (openIdx === -1) { console.error('open marker not found'); process.exit(1) }
let closeIdx = -1
for (let i = openIdx + 1; i < lines.length; i++) {
  if (lines[i] === '                      </tr>') { closeIdx = i; break }
}
if (closeIdx === -1) { console.error('close marker not found'); process.exit(1) }

let n = 0
for (let i = openIdx + 1; i < closeIdx; i++) {
  if (lines[i].trim() !== '') { lines[i] = '  ' + lines[i]; n++ }
}
fs.writeFileSync(p, lines.join('\n'), 'utf8')
console.log(`re-indented ${n} lines (rows ${openIdx + 1}..${closeIdx + 1})`)
