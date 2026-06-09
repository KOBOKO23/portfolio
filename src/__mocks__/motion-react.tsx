import React from 'react';
import { vi } from 'vitest';

function makeEl(tag: string) {
  return function MotionEl({
    children,
    initial: _initial, animate: _animate, exit: _exit,
    whileInView: _whileInView, whileHover: _whileHover,
    whileTap: _whileTap, whileFocus: _whileFocus, whileDrag: _whileDrag,
    transition: _transition, variants: _variants,
    viewport: _viewport, layout: _layout, layoutId: _layoutId,
    drag: _drag, dragConstraints: _dragConstraints,
    onAnimationStart: _onAnimationStart, onAnimationComplete: _onAnimationComplete,
    ...props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
