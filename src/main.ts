import './style.css';
import { App } from './ui/app';

const app = new App(document.getElementById('app')!);
// ใช้ตอนพัฒนา/ทดสอบจาก console
(window as unknown as { game: App }).game = app;
