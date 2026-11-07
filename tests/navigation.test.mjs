import assert from 'node:assert/strict';
import test from 'node:test';
import { primaryPath, primaryRoutes } from '../src/lib/navigation.ts';
test('old Home Screen links show a primary tab on first load',()=>{
 for(const path of ['/house-id','/house-id/','/house-id/history','/house-id/settings','/home','/shopping','/inventory','/settings']) assert.ok(primaryRoutes.includes(primaryPath(path,'house-id')));
});
test('item and category detail routes never display primary navigation',()=>{
 for(const path of ['/house-id/items/item-id','/settings/categories']) assert.ok(!primaryRoutes.includes(primaryPath(path,'house-id')));
});
