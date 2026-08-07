import test from 'node:test'; import assert from 'node:assert/strict'; import { SYSTEM } from '../index.js';
test('assistant policy forbids automatic memory',()=>{assert.match(SYSTEM,/Do not automatically save personal information as memory/);assert.match(SYSTEM,/uncertain/i);});
