'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {Prisma} = require('@prisma/client');
const models = new Map(Prisma.dmmf.datamodel.models.map(model=>[model.name, model]));
const field = (model,name) => models.get(model).fields.find(f=>f.name===name);
test('generated schema supports documented user, list, incident and change fields', () => {
  for (const [model,names] of [
    ['User',['username','phoneNumber','networkLogin','availability']],
    ['CustomList',['scope','group','columnProfile','sequence','displayType','creator']],
    ['MajorIncident',['responseTargetAt','resolutionTargetAt','updateDueAt','productTags']],
    ['ChangeRequest',['assignedAgent','approvals']],
    ['ServiceCatalogueItem',['status','icon']],
  ]) for (const name of names) assert.ok(field(model,name),model+'.'+name);
  assert.equal(field('User','username').isUnique,true);
});
test('approvals have typed targets and an assigned user relation', () => {
  assert.equal(field('Approval','approver').type,'User');
  assert.equal(field('Approval','serviceRequest').type,'ServiceRequest');
  assert.equal(field('Approval','changeRequest').type,'ChangeRequest');
});
test('team, knowledge and scheduling models have relational ownership', () => {
  assert.equal(field('TeamMembership','user').type,'User');
  assert.equal(field('TeamMembership','team').type,'Team');
  assert.deepEqual(models.get('TeamMembership').primaryKey.fields,['teamId','userId']);
  assert.equal(field('CalendarEvent','agent').type,'User');
  assert.equal(field('KnowledgeArticle','author').type,'User');
});
