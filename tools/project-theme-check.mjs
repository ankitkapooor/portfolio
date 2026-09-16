/** UI smoke checks against production builds. Run local servers on 3001–3003,
 * War Room on 8001 with isolated demo data, Narrative static UI on 8002.
 * NARRATIVE_UI_FIXTURE points to an offline run_analysis test-fixture report.
 * Browser artifacts are written outside the repositories. */
import { chromium, expect } from '../apps/disrupt-this-business/node_modules/@playwright/test/index.mjs';
import { readFile, mkdir } from 'node:fs/promises';
const artifacts = process.env.UI_ARTIFACTS || '/tmp/project-theme-shots';
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const errors = [], checks = [];
async function page() {
  const p = await browser.newPage({viewport:{width:1440,height:1000}});
  p.on('pageerror', e => errors.push(e.message));
  return p;
}
async function inspect(p, name, shot = true) {
  for (const width of [1440,768,390]) {
    await p.setViewportSize({width,height:1000});
    await p.evaluate(()=>document.fonts.ready);
    const overflow = await p.evaluate(() => {
      const width = document.documentElement.clientWidth;
      return [...document.body.querySelectorAll('*')].filter(el => {
        const r=el.getBoundingClientRect();
        if (el.matches('.skipLink:not(:focus), .skip-link:not(:focus)')) return false;
        if (!r.width || !r.height || r.left >= 0 && r.right <= width+2) return false;
        for(let a=el.parentElement;a && a!==document.body;a=a.parentElement){
          if(['auto','scroll','hidden','clip'].includes(getComputedStyle(a).overflowX)) return false;
        }
        return true;
      }).slice(0,5).map(el=>`${el.tagName}.${el.className}: ${Math.round(el.getBoundingClientRect().right)}`);
    });
    if (overflow.length) errors.push(`${name} @${width}: overflow ${overflow.join(', ')}`);
    await expect(p.locator('.project-family')).toBeVisible();
    if (shot && width!==768) await p.screenshot({path:`${artifacts}/${name}-${width}.png`,fullPage:true});
    checks.push(`${name}@${width}`);
  }
  await p.setViewportSize({width:1440,height:1000});
}
try {
  const p=await page();
  const routes={disrupt:['/','/play','/results','/methodology','/analysis'],moat:['/','/investigations/meeting-assistants','/lab/meeting-assistants','/evidence',...Array.from({length:14},(_,i)=>`/evidence/EV-${String(i+1).padStart(3,'0')}`),'/methodology'],priced:['/','/workspace/import','/workspace/review','/workspace/expectations','/workspace/operations','/workspace/ai','/workspace/challenge','/workspace/brief']};
  for(const [i,[app,paths]] of Object.entries(routes).entries()){
    for(const path of paths){
      const r=await p.goto(`http://127.0.0.1:${3001+i}${path}`);expect(r.status()).toBe(200);
      await p.locator('h1').first().waitFor();
      await inspect(p,`${app}${path==='/'?'-home':path.replaceAll('/','-')}`,!path.includes('/EV-'));
    }
  }
  await p.goto('http://127.0.0.1:3001/play');
  await p.getByRole('radio',{name:/RelayWorks/}).check();await p.getByRole('radio',{name:/^Foundation/}).check();await p.getByRole('button',{name:'Start quarter one'}).click();
  for(let q=1;q<=4;q++){
    await p.getByRole('button',{name:/Hold and preserve cash/}).click();
    if(q===1)await inspect(p,'disrupt-decision');
    await p.getByRole('button',{name:new RegExp(`^Lock Q${q}`)}).click();
    if(q===1)await inspect(p,'disrupt-resolution');
    await p.getByRole('button',{name:q===4?'See the results':`Continue to Q${q+1}`}).click();
  }
  await expect(p.getByRole('heading',{name:/RelayWorks after 4 of 4 quarters/})).toBeVisible();await inspect(p,'disrupt-completed-results');
  await p.goto('http://127.0.0.1:3002/lab/meeting-assistants');
  await p.getByRole('button',{name:/Pricing page launch pulled back for legal sign-off/}).click();await inspect(p,'moat-comparison');
  await p.getByRole('radio',{name:'Not enough information to choose'}).check();await p.getByTestId('reveal-button').click();await inspect(p,'moat-reveal');
  await p.goto('http://127.0.0.1:3003/workspace/brief');
  await p.getByLabel('Thesis',{exact:true}).fill('Theme regression: sample thesis persists.');await inspect(p,'priced-brief-edited');await p.waitForTimeout(500);await p.reload();await expect(p.getByLabel('Thesis',{exact:true})).toHaveValue('Theme regression: sample thesis persists.');
  await p.goto('http://127.0.0.1:3003/workspace/expectations');
  const map=p.getByRole('img',{name:/Value gap for/});await expect(map).toBeVisible();await map.focus();await p.keyboard.press('ArrowRight');
  await expect(p.getByRole('button',{name:/Undo, back to/})).toBeVisible();await inspect(p,'priced-map-selected');
  await p.getByRole('button',{name:/Undo, back to/}).click();
  await p.getByRole('button',{name:'Solve for growth',exact:true}).click();await expect(p.getByText(/A constant annual growth rate of/)).toBeVisible();
  await p.getByRole('button',{name:'Show data table',exact:true}).click();await expect(p.getByRole('region',{name:'Expectations map as a data table'})).toBeVisible();await inspect(p,'priced-map-table');
  const download=p.waitForEvent('download');await p.getByRole('button',{name:'Export JSON',exact:true}).click();const exported=await download;expect(exported.suggestedFilename()).toMatch(/\.json$/);await exported.saveAs(`${artifacts}/priced-export.json`);
  const layout=await p.evaluate(()=>{const body=document.querySelector('.workspace-body');const content=body.firstElementChild.getBoundingClientRect();const rail=body.lastElementChild.getBoundingClientRect();return content.right<=rail.left;});expect(layout).toBe(true);
  await p.close();

  const w=await page();await w.goto('http://127.0.0.1:8001/ui/');await inspect(w,'war-strategy');
  await w.getByRole('button',{name:'Premium fitness',exact:true}).click();await w.getByRole('button',{name:'Interpret the business',exact:true}).click();await expect(w.getByRole('button',{name:'Run the model',exact:true})).toBeVisible();await inspect(w,'war-strategy-parsed');
  await w.getByRole('button',{name:'Run the model',exact:true}).click();await expect(w.getByLabel('Filter markets by name')).toBeVisible({timeout:15000});
  await inspect(w,'war-ranking');
  await w.setViewportSize({width:390,height:844});
  await w.getByLabel('Filter markets by name').scrollIntoViewIfNeeded();await w.screenshot({path:`${artifacts}/war-mobile-map.png`});
  await w.locator('.warroom > .rail:last-child').scrollIntoViewIfNeeded();await w.screenshot({path:`${artifacts}/war-mobile-detail.png`});
  await expect(w.locator('.warroom > .rail:last-child')).toBeVisible();await w.setViewportSize({width:1440,height:1000});
  await w.getByTitle('Pin to comparison',{exact:true}).nth(0).click();await w.getByTitle('Pin to comparison',{exact:true}).nth(0).click();
  await w.getByRole('button',{name:/^Compare/}).click();await inspect(w,'war-compare');
  await w.getByRole('button',{name:'Sensitivity',exact:true}).click();await w.getByRole('button',{name:'Run the simulation',exact:true}).click();await expect(w.getByRole('button',{name:'Run again',exact:true})).toBeVisible({timeout:30000});await inspect(w,'war-sensitivity');
  await w.getByRole('button',{name:'Methodology',exact:true}).click();await inspect(w,'war-methodology');
  await w.close();

  if(process.env.NARRATIVE_UI_FIXTURE){
    const fixture=JSON.parse(await readFile(process.env.NARRATIVE_UI_FIXTURE,'utf8'));
    const n=await page();let fail=false;
    await n.route('**/api/v1/analysis',r=>r.fulfill({status:fail?422:200,json:fail?{detail:'Offline test: unknown ticker'}:{analysis_id:fixture.analysis_id,status:'pending'}}));
    await n.route('**/api/v1/analysis/*',r=>r.fulfill({json:fixture}));
    await n.goto('http://127.0.0.1:8002/');await expect(n.locator('#report')).toBeHidden();await inspect(n,'narrative-intro');
    await n.locator('#ticker').fill('MSFT');await n.locator('#submit').click();await expect(n.locator('#progress')).toBeVisible();await inspect(n,'narrative-progress',false);
    await expect(n.locator('#report')).toBeVisible({timeout:15000});await expect(n.locator('#intro')).toBeHidden();await expect(n.locator('#claims-body tr')).toHaveCount(fixture.priorities.length);await inspect(n,'narrative-report');
    await n.locator('#sort').selectOption('score-asc');await n.locator('#claims-body tr').first().click();await inspect(n,'narrative-claim-detail');
    await n.locator('#reset').click();await expect(n.locator('#report')).toBeHidden();await expect(n.locator('#intro')).toBeVisible();fail=true;await n.locator('#ticker').fill('ZZZZ');await n.locator('#submit').click();await expect(n.locator('#failure')).toBeVisible();await inspect(n,'narrative-failure');await n.close();
  }
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`PASS: ${checks.length} responsive screen checks; Priced In map/solver/export; War Room parse/rank/pin/compare/simulate; Narrative progress/report/sort/detail/reset/error. No uncaught browser errors.`);
}finally{await browser.close();}
