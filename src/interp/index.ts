// จุดเข้าใช้งานตัวแปลภาษา: runProgram(โค้ด, host)
import { check } from './checker';
import { parse } from './parser';
import { Runtime } from './runtime';
import { CompileError, Diag, Host, RunOptions, RunResult } from './types';

export * from './types';
export { fmtFloat } from './runtime';

/** host เปล่า ใช้ตอนทดสอบตัวแปลภาษาอย่างเดียว */
export function nullHost(inputs: number[] = []): Host {
  return { fns: {}, call: () => undefined, halted: null, inputs: [...inputs] };
}

/** ตรวจโค้ดอย่างเดียว (ไม่รัน) คืน error ตัวแรก หรือ undefined */
export function compile(src: string, host: Host = nullHost()): { error?: Diag; warnings: Diag[] } {
  try {
    const prog = parse(src);
    return { warnings: check(prog, host.fns) };
  } catch (e) {
    if (e instanceof CompileError) return { error: e.diag, warnings: [] };
    throw e;
  }
}

export function runProgram(src: string, host: Host = nullHost(), opts: RunOptions = {}): RunResult {
  let prog;
  let lint: Diag[];
  try {
    prog = parse(src);
    lint = check(prog, host.fns);
  } catch (e) {
    if (e instanceof CompileError) {
      return { compileError: e.diag, warnings: [], trace: [], serial: '', loopsRun: 0, calls: [] };
    }
    throw e;
  }
  const rt = new Runtime(prog, host, opts);
  const res = rt.run(opts.loops ?? 1);
  res.warnings = [...lint, ...res.warnings];
  return res;
}
