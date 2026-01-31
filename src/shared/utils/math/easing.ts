import { EASING } from '@/shared/constants/utils';

export const easeInBounce = (t: number): number => 1 - easeOutBounce(1 - t);
export const easeInCubic = (t: number): number => t * t * t;
export const easeInElastic = (t: number): number => {
  if (t === 0 || t === 1) return t;

  return (
    -Math.pow(EASING.ELASTIC_BASE, EASING.ELASTIC_EXPONENT * t - EASING.ELASTIC_OFFSET) *
    Math.sin(
      (t * EASING.ELASTIC_OFFSET - EASING.ELASTIC_PHASE_OFFSET) *
        ((EASING.QUAD_MULTIPLIER * Math.PI) / EASING.ELASTIC_PERIOD_DIVISOR)
    )
  );
};
export const easeInOutCubic = (t: number): number =>
  t < EASING.HALF
    ? EASING.CUBIC_MULTIPLIER * t * t * t
    : 1 -
      Math.pow(-EASING.CUBIC_DIVISOR * t + EASING.QUAD_MULTIPLIER, EASING.CUBIC_POWER) /
        EASING.CUBIC_DIVISOR;
export const easeInOutElastic = (t: number): number => {
  if (t === 0 || t === 1) return t;
  if (t < EASING.HALF) {
    return (
      -(
        Math.pow(
          EASING.ELASTIC_BASE,
          EASING.ELASTIC_IN_OUT_MULTIPLIER * t - EASING.ELASTIC_EXPONENT
        ) *
        Math.sin(
          (EASING.ELASTIC_IN_OUT_MULTIPLIER * t - EASING.ELASTIC_IN_OUT_PHASE_OFFSET) *
            ((EASING.QUAD_MULTIPLIER * Math.PI) / EASING.ELASTIC_IN_OUT_PERIOD_DIVISOR)
        )
      ) / EASING.CUBIC_DIVISOR
    );
  }

  return (
    (Math.pow(
      EASING.ELASTIC_BASE,
      -EASING.ELASTIC_IN_OUT_MULTIPLIER * t + EASING.ELASTIC_EXPONENT
    ) *
      Math.sin(
        (EASING.ELASTIC_IN_OUT_MULTIPLIER * t - EASING.ELASTIC_IN_OUT_PHASE_OFFSET) *
          ((EASING.QUAD_MULTIPLIER * Math.PI) / EASING.ELASTIC_IN_OUT_PERIOD_DIVISOR)
      )) /
      EASING.CUBIC_DIVISOR +
    1
  );
};
export const easeInOutQuad = (t: number): number =>
  t < EASING.HALF
    ? EASING.QUAD_MULTIPLIER * t * t
    : -1 + (EASING.QUAD_OFFSET - EASING.QUAD_MULTIPLIER * t) * t;
export const easeInOutSine = (t: number): number =>
  -(Math.cos(Math.PI * t) - 1) / EASING.CUBIC_DIVISOR;
export const easeInQuad = (t: number): number => t * t;
export const easeLinear = (t: number): number => t;
export const easeOutBounce = (inputT: number): number => {
  const { BOUNCE_N1: n1, BOUNCE_D1: d1 } = EASING;
  let t = inputT;

  if (t < EASING.BOUNCE_THRESHOLD_1 / d1) return n1 * t * t;
  if (t < EASING.BOUNCE_THRESHOLD_2 / d1) {
    t -= EASING.BOUNCE_OFFSET_1 / d1;

    return n1 * t * t + EASING.BOUNCE_RESULT_1;
  }
  if (t < EASING.BOUNCE_THRESHOLD_3 / d1) {
    t -= EASING.BOUNCE_OFFSET_2 / d1;

    return n1 * t * t + EASING.BOUNCE_RESULT_2;
  }
  t -= EASING.BOUNCE_OFFSET_3 / d1;

  return n1 * t * t + EASING.BOUNCE_RESULT_3;
};
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, EASING.CUBIC_POWER);
export const easeOutElastic = (t: number): number => {
  if (t === 0 || t === 1) return t;

  return (
    Math.pow(EASING.ELASTIC_BASE, -EASING.ELASTIC_EXPONENT * t) *
      Math.sin(
        (t * EASING.ELASTIC_OFFSET - EASING.BOUNCE_RESULT_1) *
          ((EASING.QUAD_MULTIPLIER * Math.PI) / EASING.ELASTIC_PERIOD_DIVISOR)
      ) +
    1
  );
};
export const easeOutQuad = (t: number): number => t * (EASING.QUAD_MULTIPLIER - t);
