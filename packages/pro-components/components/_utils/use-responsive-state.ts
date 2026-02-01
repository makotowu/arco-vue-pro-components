import { ref, computed, Ref, onUnmounted, onMounted } from 'vue';
import { isObject } from './is';
import ResponsiveObserve, {
  responsiveArray,
  ScreenMap,
  Breakpoint,
} from './responsive-observe';

export type ResponsiveValue = Partial<Record<Breakpoint, number>>;

function isResponsiveValue(
  val: number | ResponsiveValue
): val is ResponsiveValue {
  return isObject(val);
}

export function useResponsiveState(
  val: Ref<number | ResponsiveValue>,
  defaultVal: number,
  fallbackToXs = false
) {
  const screens = ref<ScreenMap>({
    xs: true,
    sm: true,
    md: true,
    lg: true,
    xl: true,
    xxl: true,
  });
  const result = computed(() => {
    let res = defaultVal;
    if (isResponsiveValue(val.value)) {
      for (let i = 0; i < responsiveArray.length; i++) {
        const breakpoint = responsiveArray[i];
        if (
          (screens.value[breakpoint] ||
            (breakpoint === 'xs' && fallbackToXs)) &&
          val.value[breakpoint] !== undefined
        ) {
          res = val.value[breakpoint] as number;
          break;
        }
      }
    } else {
      res = val.value;
    }
    return res;
  });

  let subscribeToken = '';

  onMounted(() => {
    subscribeToken = ResponsiveObserve.subscribe((screensVal) => {
      if (isResponsiveValue(val.value)) {
        screens.value = screensVal;
      }
    });
  });

  onUnmounted(() => {
    if (subscribeToken) {
      ResponsiveObserve.unsubscribe(subscribeToken);
    }
  });

  return result;
}
