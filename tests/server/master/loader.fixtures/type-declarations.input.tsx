// @ts-nocheck
import React from 'react';

declare const a: number;
declare function b(): void;
interface A {}
type B = {};

export default { title: 'Button' };

export const Text: A & B = (p: A & B = b(a)) => <button {...p} />;