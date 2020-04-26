(function () {
    "use strict";

    function r(e, t) {
        if (!(e instanceof t)) throw new TypeError("Cannot call a class as a function")
    }
    Object.defineProperty(Cesium, "__esModule", {
        value: !0
    }),
        Cesium.DivPoint = void 0;
    var n = function () {
        function e(e, t) {
            for (var i = 0; i < t.length; i++) {
                var a = t[i];
                a.enumerable = a.enumerable || !1, a.configurable = !0, "value" in a && (a.writable = !0), Object.defineProperty(e, a.key, a)
            }
        }
        return function (t, i, a) {
            return i && e(t.prototype, i), a && e(t, a), t
        }
    }();
    Cesium.DivPoint = (function () {
        function e(t, i) {
          r(this, e),
            (this.viewer = t),
            (this.position = i.position),
            (this.position_original = i.position),
            (this.anchor = i.anchor),
            (i.visibleDistanceMin || i.visibleDistanceMax) &&
              (i.distanceDisplayCondition = new a.DistanceDisplayCondition(
                i.visibleDistanceMin || 0,
                i.visibleDistanceMax || 1e5
              )),
            (this._distanceDisplayCondition = i.distanceDisplayCondition),
            (this._heightReference = Cesium.defaultValue(
              i.heightReference,
              Cesium.HeightReference.NONE
            )),
            (this.opts = i),
            (this._depthTest = !0),
            (this.$view =document.createElement("div"));
            this.$view.className ='divpoint2';
            this.$view.innerHTML=i.html;
            this.$view.style.position="absolute";
            this.$view.style.left=0;
            this.$view.style.top=0;
            document.querySelector("#" + t._container.id).appendChild(this.$view);
            (this.visible = Cesium.defaultValue(i.visible, !0));
        //   var n = this;
        //   (i.click || i.popup) &&
        //     this.$view.click(function (e) {
        //       i.popup && t.mars.popup.show(i, n.position),
        //         i.click && i.click(i, n, e);
        //     }),
        //     i.tooltip &&
        //       this.$view.hover(
        //         function () {
        //           t.mars.tooltip.show(i, n.position);
        //         },
        //         function () {
        //           t.mars.tooltip.close();
        //         }
        //       ),
            t.scene.postRender.addEventListener(this.updateViewPoint, this);
        }
        return (
          n(e, [
            {
              key: "updateViewPoint",
              value: function () {
                if (this._visible) {
                  this._heightReference == Cesium.HeightReference.CLAMP_TO_GROUND
                    ? (this.position = (0, u.updateHeightForClampToGround)(
                        this.viewer,
                        this.position_original
                      ))
                    : this._heightReference ==
                        Cesium.HeightReference.RELATIVE_TO_GROUND &&
                      (this.position = (0, u.updateHeightForClampToGround)(
                        this.viewer,
                        this.position_original,
                        !0
                      ));
                  var e,
                    t = this.viewer.scene,
                    i = Cesium.SceneTransforms.wgs84ToWindowCoordinates(
                      t,
                      this.position
                    );
                  if (
                    ((e =
                      t.mode === Cesium.SceneMode.SCENE3D
                        ? Cesium.Cartesian3.distance(
                            this.position,
                            this.viewer.camera.position
                          )
                        : this.viewer.camera.positionCartographic.height),
                    null == i ||
                      (this._distanceDisplayCondition &&
                        (this._distanceDisplayCondition.near > e ||
                          this._distanceDisplayCondition.far < e)))
                  )
                    return void (
                        this.$view.style.display === 'block' && (this.$view.style.display="none")
                    );
                  if (this._depthTest && t.mode === Cesium.SceneMode.SCENE3D) {
                    var r = t.camera.getPickRay(i),
                      n = t.globe.pick(r, t);
                    if (n) {
                      if (Cesium.Cartesian3.distance(this.position, n) > 1e6)
                        return void (
                            this.$view.style.display === 'block' && (this.$view.style.display="none")
                        );
                    }
                  }
                  var o = this.$view.offsetHeight,
                    s = this.$view.offsetWidth,
                    l = i.x,
                    c = i.y - o;
                  this.anchor
                    ? ("center" == this.anchor[0]
                        ? (l -= s / 2)
                        : (l += this.anchor[0]),
                      (c += this.anchor[1]))
                    : (l -= s / 2),
                    this.$view.style.display === 'block'|| (this.$view.style.display="block");
                  var h = 1;
                  if (this.opts.scaleByDistance) {
                    var d = this.opts.scaleByDistance;
                    h =
                      e <= d.near
                        ? d.nearValue
                        : e > d.near && e < d.far
                        ? d.nearValue +
                          ((d.farValue - d.nearValue) * (e - d.near)) /
                            (d.far - d.near)
                        : d.farValue;
                  }
                  var f = "matrix(" + h + ",0,0," + h + "," + l + "," + c + ")";
                  this.$view.style.transform=f;
                  this.$view.style.transformOrigin="left bottom 0";

                    this.opts.postRender &&
                      this.opts.postRender({
                        x: l,
                        y: c,
                        height: o,
                        width: s,
                        distance: e,
                      });
                }
              },
            },
            {
              key: "setVisible",
              value: function (e) {
                (this._visible = e), e ? this.$view.style.display="block":this.$view.style.display="none";
              },
            },
            {
              key: "destroy",
              value: function () {
                this.viewer.scene.postRender.removeEventListener(
                  this.updateViewPoint,
                  this
                ),
                  this.$view.parentNode.removeChild(this.$view)
                  (this.$view = null),
                  (this.position = null),
                  (this.anchor = null),
                  (this.viewer = null);
              },
            },
            {
              key: "dom",
              get: function () {
                return this.$view;
              },
            },
            {
              key: "visible",
              get: function () {
                return this._visible;
              },
              set: function (e) {
                (this._visible = e), this.setVisible(e);
              },
            },
            {
              key: "depthTest",
              get: function () {
                return this._depthTest;
              },
              set: function (e) {
                this._depthTest = e;
              },
            },
          ]),
          e
        );
      })();
})()
