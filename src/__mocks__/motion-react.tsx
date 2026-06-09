import React from 'react';
import { vi } from 'vitest';

function makeEl(tag: string) {
  return function MotionEl({
    children, initial, animate, exit, whileInView, whileHover,
    whileTap, whileFocus, whileDrag, transition, variants,
    viewport, layout, layoutId, drag, dragConstraints,
    onAnimationStart, onAnimationComplete,
    ...props
  }: any) {
    return React.createElement(tag, props, children);
  };
}

export const motion = {
  div: makeEl('div'), section: makeEl('section'), article: makeEl('article'),
  span: makeEl('span'), p: makeEl('p'), h1: makeEl('h1'), h2: makeEl('h2'),
  h3: makeEl('h3'), ul: makeEl('ul'), li: makeEl('li'), a: makeEl('a'),
  button: makeEl('button'), img: makeEl('img'), header: makeEl('header'),
  footer: makeEl('footer'), main: makeEl('main'), nav: makeEl('nav'),
  form: makeEl('form'),
};

export const AnimatePresence = ({ children }: any) => children;
export const useAnimation    = () => ({ start: vi.fn(), stop: vi.fn() });
export const useMotionValue  = (v: any) => ({ get: () => v, set: vi.fn() });
export const useTransform    = () => ({ get: vi.fn() });
