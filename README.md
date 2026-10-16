# simpleglass

the other liquid glass packages break your page. this one wraps one element and leaves everything else alone.

no white ring. clicks still work. it does not lock scroll or clone your whole DOM.

```
npm i simpleglass
```

```js
import { glass } from 'simpleglass'

glass(document.querySelector('.card'))
```

pass the nodes behind the card. they keep their real place on the screen, so a page section works the same as a full-viewport wash. ids are stripped on the clone. a second card ignores clones that already sit inside a lens, and dialogs are left out so a modal does not copy itself.

```js
glass(document.querySelector('.card'), { from: '#wash, main' })
```

`bezel` is the bending rim as a fraction of the card. default `0.16`. the old lens stayed flat until the last 2 percent, so a large card did not look like glass.

`strength` is the displacement scale in pixels. the red and blue channels use a slightly different scale. that split is the fringe.

```js
const pane = glass(el, { from: 'main', radius: 24, strength: 64, frost: 0.03, bezel: 0.16 })
pane.update()
pane.destroy()
```

`update()` after the content behind the card changes, or after a dialog opens. scroll and resize are already handled. a dialog `toggle` event does not always fire, so call `glass` or `update()` yourself once the card is on screen.

the filter box stays on the card. stretching it also stretches the displacement map, and the bend slides off the rim.

a strict content security policy needs `style-src 'unsafe-inline'` (the package injects one style tag and writes element styles) and `img-src data:` (the displacement map is a data URL). no inline script.

displacement math from [liquid-glass-react](https://github.com/rdev/liquid-glass-react) (MIT). not apple, not affiliated.
