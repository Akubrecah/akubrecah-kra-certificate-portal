const html = `<tr><td class="textAlignRight"><strong>PIN Registration Date :</strong></td>
<td class="textAlignLeft">12/06/2018</td></tr>`;
const matches = [...html.matchAll(/<td[^>]*>(\d{2}\/\d{2}\/\d{4})<\/td>/g)];
console.log(matches);
