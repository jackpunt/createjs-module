// import from @types/easeljs (& createjs-lib & tweenjs)
/// <reference types="createjs-lib" />
/// <reference types="easeljs" />

// update module for ESM & tsc-6 "bundler" compatability
declare module '@thegraid/easeljs-module' {
  // @types/createjs-lib/index.d.ts
  export import Event = createjs.Event;
  export import EventDispatcher = createjs.EventDispatcher;
  // @types/easeljs/index.d.ts
  export import AlphaMapFilter = createjs.AlphaMapFilter;
  export import AlphaMaskFilter = createjs.AlphaMaskFilter;
  export import Bitmap = createjs.Bitmap;
  export import BitmapCache = createjs.BitmapCache;
  export import ScaleBitmap = createjs.ScaleBitmap;
  export import BitmapText = createjs.BitmapText;
  export import BlurFilter = createjs.BlurFilter;
  export import ButtonHelper = createjs.ButtonHelper;
  export import ColorFilter = createjs.ColorFilter;
  export import ColorMatrix = createjs.ColorMatrix;
  export import ColorMatrixFilter = createjs.ColorMatrixFilter;
  export import Container = createjs.Container;
  export import DisplayObject = createjs.DisplayObject;
  export import DisplayProps = createjs.DisplayProps;
  export import DOMElement = createjs.DOMElement;
  export import EaselJS = createjs.EaselJS;
  export import Filter = createjs.Filter;
  export import Graphics = createjs.Graphics;
    export import Arc = createjs.Graphics.Arc;
    export import ArcTo = createjs.Graphics.ArcTo;
    export import BeginPath = createjs.Graphics.BeginPath;
    export import BezierCurveTo = createjs.Graphics.BezierCurveTo;
    export import Circle = createjs.Graphics.Circle;
    export import ClosePath = createjs.Graphics.ClosePath;
    export import Fill = createjs.Graphics.Fill;
    export import LineTo = createjs.Graphics.LineTo;
    export import MoveTo = createjs.Graphics.MoveTo;
    export import PolyStar = createjs.Graphics.PolyStar;
    export import QuadraticCurveTo = createjs.Graphics.QuadraticCurveTo;
    export import Rect = createjs.Graphics.Rect;
    export import RoundRect = createjs.Graphics.RoundRect;
    export import Stroke = createjs.Graphics.Stroke;
    export import StrokeStyle = createjs.Graphics.StrokeStyle;
  export import Matrix2D = createjs.Matrix2D;
  export import MouseEvent = createjs.MouseEvent;
  export import MovieClip = createjs.MovieClip;
  export import MovieClipPlugin = createjs.MovieClipPlugin;
  export import Point = createjs.Point;
  export import Rectangle = createjs.Rectangle;
  export import Shadow = createjs.Shadow;
  export import Shape = createjs.Shape;
  export import Sprite = createjs.Sprite;
  export import SpriteContainer = createjs.SpriteContainer;
  export import SpriteSheet = createjs.SpriteSheet;
  export import SpriteSheetBuilder = createjs.SpriteSheetBuilder;
  export import SpriteSheetUtils = createjs.SpriteSheetUtils;
  export import SpriteStage = createjs.SpriteStage;
  export import Stage = createjs.Stage;
  export import StageGL = createjs.StageGL;
  export import Text = createjs.Text;
  export import Ticker = createjs.Ticker;
  export import TickerEvent = createjs.TickerEvent;
  export import Touch = createjs.Touch;
  export import UID = createjs.UID;
}
