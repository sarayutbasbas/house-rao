import test from 'node:test';import assert from 'node:assert/strict';import {productCode} from '../src/lib/barcode.ts';
test('reads EAN and UPC identifiers without losing leading zeroes',()=>{assert.equal(productCode(' 012345678905 '),'012345678905');assert.equal(productCode('8850000000000'),'8850000000000');});
test('reads GS1 QR identifiers without opening their URL',()=>{assert.equal(productCode('https://id.gs1.org/01/09506000134352/10/ABC'),'09506000134352');assert.equal(productCode('(01)09506000134352(17)271231'),'09506000134352');});
test('rejects arbitrary URLs, scripts and non-product QR text',()=>{for(const value of ['https://example.com','javascript:alert(1)','abc','123','https://evil/01/1234'])assert.equal(productCode(value),null);});
