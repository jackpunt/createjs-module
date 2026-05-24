# EaselJS library module for Angular and Ionic

What it does: the grunt compile edits the extant easeljs.js file to wrap the various bits as functions in a module.

Copy in easeljs.js, set EASEL and CREATE versions in gulpfile.es6.js; then <code>npm run build; </code>

The resulting package is loadable as a module (as shown below)

<b>TODO:</b> someday stream edit the EaselJS original source to use ecmascript class and methods.
<br>because someday, we will want and need tsc to generate the real, correct .d.ts file(s).

<b>Note:</b> this easeljs branch is up-to-date, the branch for larger createjs-module has been untouched for a long time.

Updated to jackpunt/EaselJS/easeljs-1.0.5 collection as ESM with @types/createjs

Forked from CreateJS/EaselJS/easeljs-1.0.3 with fixes

@thegraid/createjs-module includes (tween, sound, preload) but easeljs-module is small/concise with just the graphics components.

* EaselJS
* TweenJS
* SoundJS
* PreloadJS

You can find documentation at [CreateJS](http://blog.createjs.com/).



## Install

```bash
npm install @thegraid/easeljs-module --save
```

**Angular**
```ts
import { Component, AfterViewInit } from '@angular/core';
import { Stage, Shape, Text } from '@thegraid/easeljs-module';

@Component({
  selector: 'app-root',
  template: '<canvas width="500" height=500 id="demoCanvas"></canvas>'
})
export class AppComponent implements AfterViewInit {

  ngAfterViewInit() {
    var stage = new Stage("demoCanvas");
    var circle = new Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = 10;
    circle.y = 10;
    stage.addChild(circle);

    stage.update();

    // If using full createjs-module, Tween, Ease are available
    Tween.get(circle, { loop: true })
    .to({ x: 400 }, 1000, Ease.getPowInOut(4))
    .to({ alpha: 0, y: 175 }, 500, Ease.getPowInOut(2))
    .to({ alpha: 0, y: 225 }, 100)
    .to({ alpha: 1, y: 200 }, 500, Ease.getPowInOut(2))
    .to({ x: 100 }, 800, Ease.getPowInOut(2));

    Ticker.setFPS(60);
    Ticker.addEventListener("tick", stage);
  }

}
```

**Ionic**
```ts
import {Component} from '@angular/core';
import { Stage, Shape, Text } from '@thegraid/easeljs-module';

@Component({
  selector: 'project-name-app',
  template: `
    <ion-content padding>
     <canvas width="500" height=500 id="demoCanvas"></canvas>
    </ion-content>
  `
})
export class MyApp {
  ionViewDidEnter() {
    var stage = new Stage("demoCanvas");
    var circle = new Shape();
    circle.graphics.beginFill("DeepSkyBlue").drawCircle(0, 0, 50);
    circle.x = 10;
    circle.y = 10;
    stage.addChild(circle);

    stage.update();

    Tween.get(circle, { loop: true })
    .to({ x: 400 }, 1000, Ease.getPowInOut(4))
    .to({ alpha: 0, y: 175 }, 500, Ease.getPowInOut(2))
    .to({ alpha: 0, y: 225 }, 100)
    .to({ alpha: 1, y: 200 }, 500, Ease.getPowInOut(2))
    .to({ x: 100 }, 800, Ease.getPowInOut(2));

    Ticker.setFPS(60);
    Ticker.addEventListener("tick", stage);
  }
  
  constructor(){
  }
}
```

Credit Matt Balmer
