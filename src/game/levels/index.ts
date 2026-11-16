// ลงทะเบียนด่านทั้งหมด — เพิ่มด่านใหม่: สร้างไฟล์ แล้วใส่ชื่อในรายการ LEVELS ตามลำดับที่ต้องการให้เล่น
import { ActInfo, Level } from '../types';
import { l01 } from './act1/l01';
import { l02 } from './act1/l02';
import { l03 } from './act1/l03';
import { l04 } from './act1/l04';
import { l05 } from './act1/l05';
import { l06 } from './act1/l06';
import { l07 } from './act1/l07';
import { l08 } from './act1/l08';
import { l09 } from './act1/l09';
import { m01 } from './act2/m01';
import { m02 } from './act2/m02';
import { m03 } from './act2/m03';
import { m04 } from './act2/m04';
import { m05 } from './act2/m05';
import { m06 } from './act2/m06';
import { m07 } from './act2/m07';
import { n01 } from './act3/n01';
import { n02 } from './act3/n02';
import { n03 } from './act3/n03';
import { n04 } from './act3/n04';
import { n05 } from './act3/n05';
import { o01 } from './act4/o01';
import { o02 } from './act4/o02';
import { o03 } from './act4/o03';
import { o04 } from './act4/o04';
import { o05 } from './act4/o05';
import { o06 } from './act4/o06';
import { p01 } from './act5/p01';
import { p02 } from './act5/p02';
import { p03 } from './act5/p03';
import { p04 } from './act5/p04';
import { p05 } from './act5/p05';
import { p06 } from './act5/p06';
import { q01 } from './act6/q01';
import { q02 } from './act6/q02';
import { q03 } from './act6/q03';
import { q04 } from './act6/q04';
import { q05 } from './act6/q05';

export const LEVELS: Level[] = [
  l01, l02, l03, l04, l05, l06, l07, l08, l09,
  m01, m02, m03, m04, m05, m06, m07,
  n01, n02, n03, n04, n05,
  o01, o02, o03, o04, o05, o06,
  p01, p02, p03, p04, p05, p06,
  q01, q02, q03, q04, q05,
];

/** เนื้อเรื่องทั้ง 7 องก์ องก์ที่ยังไม่มีด่านใน LEVELS จะแสดงเป็นด่านล็อกตามชื่อใน planned */
export const ACTS: ActInfo[] = [
  {
    n: 1,
    title: 'ยานถูกบุก',
    blurb: 'ชาวเคลธบุกขึ้นยานอรุณ-7 กลางดึก ฝ่าจากห้องพักไปให้ถึงโรงเก็บยาน',
    teaches: 'โครงสร้างโปรแกรม · Serial · ตัวแปร · ชนิดข้อมูล · const · การคำนวณ · if / else',
    planned: [],
  },
  {
    n: 2,
    title: 'สู้กลับ',
    blurb: 'ยานกู้ชีพถูกล้อม เปิดป้อมปืนและโดรนของยานขึ้นมาสู้',
    teaches: 'switch / case · for · while · do…while · break · continue',
    planned: [],
  },
  {
    n: 3,
    title: 'หนีลงดาว',
    blurb: 'ปล่อยยานกู้ชีพ ฝ่าชั้นบรรยากาศ ลงจอดบนดาวเวฬา',
    teaches: 'ฟังก์ชัน · parameter · return · ตัวแปร local / global',
    planned: [],
  },
  {
    n: 4,
    title: 'ผจญภัยบนดาว',
    blurb: 'สำรวจซากสถานีเก่า เก็บตัวอย่าง ถอดสัญญาณของชาวเคลธ',
    teaches: 'อาร์เรย์ · String และ char · เกมทายรหัส · วิธีหาบั๊ก',
    planned: [],
  },
  {
    n: 5,
    title: 'หลบนักล่า',
    blurb: 'นักล่าของเคลธตามลงมา บิตได้ล้อและเซนเซอร์ ต้องขับหลบเอง',
    teaches: 'มอเตอร์ · ฟังก์ชันเดิน/เลี้ยว · เซนเซอร์วัดระยะ · หลบสิ่งกีดขวาง',
    planned: [],
  },
  {
    n: 6,
    title: 'หาทางกลับขึ้นไป',
    blurb: 'ซ่อมกระสวยเก่า ตั้งโปรแกรมนำร่อง แล้วบังคับจากระยะไกล',
    teaches: 'state machine: enum + switch + millis() · รับคำสั่งทาง Serial',
    planned: [],
  },
  {
    n: 7,
    title: 'ศึกสุดท้าย',
    blurb: 'กลับขึ้นยานอรุณ-7 ยึดห้องเครื่องคืน ปิดประตูมิติของชาวเคลธ',
    teaches: 'รวมทุกเรื่อง ออกแบบโปรแกรมเองทั้งชิ้น',
    planned: ['เทียบท่าอรุณ-7', 'ยึดห้องเครื่อง', 'ฝ่าทางเดินสุดท้าย', 'ปิดประตูมิติ'],
  },
];

export function levelById(id: string): Level | undefined {
  return LEVELS.find((l) => l.id === id);
}
