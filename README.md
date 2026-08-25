# workingliquidglass

the other liquid glass packages break your page. this one wraps one element and leaves everything else alone.

no white ring. clicks still work. it does not lock scroll or clone your whole DOM.

```js
import { glass } from 'workingliquidglass'

glass(document.querySelector('.card'))
```

if you want the background behind it to actually bend, pass those nodes. ids get stripped on the clone so you don't get duplicate-id bugs.

```js
glass(document.querySelector('.card'), { from: '#bg, #stars' })
```

```js
const pane = glass(el, { radius: 24, strength: 64, frost: 0.03 })
pane.update()
pane.destroy()
```

displacement math from [liquid-glass-react](https://github.com/rdev/liquid-glass-react) (MIT). not apple, not affiliated.
