define([
        '../Core/ApproximateTerrainHeights',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Cartesian4',
        '../Core/Cartographic',
        '../Core/Check',
        '../Core/Credit',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/deprecationWarning',
        '../Core/destroyObject',
        '../Core/DeveloperError',
        '../Core/DoublyLinkedList',
        '../Core/Ellipsoid',
        '../Core/Event',
        '../Core/JulianDate',
        '../Core/ManagedArray',
        '../Core/Math',
        '../Core/Matrix3',
        '../Core/Matrix4',
        '../Core/Resource',
        '../Core/RuntimeError',
        '../Core/Transforms',
        '../Renderer/ClearCommand',
        '../Renderer/Pass',
        '../Renderer/RenderState',
        '../ThirdParty/when',
        './Axis',
        './Cesium3DTileImplicit',
        './Cesium3DTileColorBlendMode',
        './Cesium3DTileContentState',
        './Cesium3DTileOptimizations',
        './Cesium3DTilePass',
        './Cesium3DTilePassState',
        './Cesium3DTileRefine',
        './Cesium3DTilesetCache',
        './Cesium3DTilesetHeatmap',
        './Cesium3DTilesetMostDetailedTraversal',
        './Cesium3DTilesetStatistics',
        './Cesium3DTilesetTraversalImplicit',
        './Cesium3DTileStyleEngine',
        './ClippingPlaneCollection',
        './LabelCollection',
        './PointCloudEyeDomeLighting',
        './PointCloudShading',
        './SceneMode',
        './ShadowMode',
        './StencilConstants',
        './SubtreeInfo',
        './TileBoundingRegion',
        './TileBoundingSphere',
        './TileOrientedBoundingBox'
    ], function(
        ApproximateTerrainHeights,
        Cartesian2,
        Cartesian3,
        Cartesian4,
        Cartographic,
        Check,
        Credit,
        defaultValue,
        defined,
        defineProperties,
        deprecationWarning,
        destroyObject,
        DeveloperError,
        DoublyLinkedList,
        Ellipsoid,
        Event,
        JulianDate,
        ManagedArray,
        CesiumMath,
        Matrix3,
        Matrix4,
        Resource,
        RuntimeError,
        Transforms,
        ClearCommand,
        Pass,
        RenderState,
        when,
        Axis,
        Cesium3DTileImplicit,
        Cesium3DTileColorBlendMode,
        Cesium3DTileContentState,
        Cesium3DTileOptimizations,
        Cesium3DTilePass,
        Cesium3DTilePassState,
        Cesium3DTileRefine,
        Cesium3DTilesetCache,
        Cesium3DTilesetHeatmap,
        Cesium3DTilesetMostDetailedTraversal,
        Cesium3DTilesetStatistics,
        Cesium3DTilesetTraversalImplicit,
        Cesium3DTileStyleEngine,
        ClippingPlaneCollection,
        LabelCollection,
        PointCloudEyeDomeLighting,
        PointCloudShading,
        SceneMode,
        ShadowMode,
        StencilConstants,
        SubtreeInfo,
        TileBoundingRegion,
        TileBoundingSphere,
        TileOrientedBoundingBox) {
    'use strict';

    /**
     * A {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification|3D Tiles tileset},
     * used for streaming massive heterogeneous 3D geospatial datasets.
     *
     * @alias Cesium3DTilesetImplicit
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Resource|String|Promise<Resource>|Promise<String>} options.url The url to a tileset JSON file.
     * @param {Boolean} [options.show=true] Determines if the tileset will be shown.
     * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] A 4x4 transformation matrix that transforms the tileset's root tile.
     * @param {ShadowMode} [options.shadows=ShadowMode.ENABLED] Determines whether the tileset casts or receives shadows from each light source.
     * @param {Number} [options.maximumScreenSpaceError=16] The maximum screen space error used to drive level of detail refinement.
     * @param {Number} [options.maximumMemoryUsage=512] The maximum amount of memory in MB that can be used by the tileset.
     * @param {Boolean} [options.cullWithChildrenBounds=true] Optimization option. Whether to cull tiles using the union of their children bounding volumes.
     * @param {Boolean} [options.cullRequestsWhileMoving=true] Optimization option. Don't request tiles that will likely be unused when they come back because of the camera's movement.
     * @param {Number} [options.cullRequestsWhileMovingMultiplier=60.0] Optimization option. Multiplier used in culling requests while moving. Larger is more aggressive culling, smaller less aggressive culling.
     * @param {Boolean} [options.preloadWhenHidden=false] Preload tiles when <code>tileset.show</code> is <code>false</code>. Loads tiles as if the tileset is visible but does not render them.
     * @param {Boolean} [options.preloadFlightDestinations=true] Optimization option. Preload tiles at the camera's flight destination while the camera is in flight.
     * @param {Boolean} [options.preferLeaves=false] Optimization option. Prefer loading of leaves first.
     * @param {Boolean} [options.dynamicScreenSpaceError=false] Optimization option. Reduce the screen space error for tiles that are further away from the camera.
     * @param {Number} [options.dynamicScreenSpaceErrorDensity=0.00278] Density used to adjust the dynamic screen space error, similar to fog density.
     * @param {Number} [options.dynamicScreenSpaceErrorFactor=4.0] A factor used to increase the computed dynamic screen space error.
     * @param {Number} [options.dynamicScreenSpaceErrorHeightFalloff=0.25] A ratio of the tileset's height at which the density starts to falloff.
     * @param {Number} [options.progressiveResolutionHeightFraction=0.3] Optimization option. If between (0.0, 0.5], tiles at or above the screen space error for the reduced screen resolution of <code>progressiveResolutionHeightFraction*screenHeight</code> will be prioritized first. This can help get a quick layer of tiles down while full resolution tiles continue to load.
     * @param {Boolean} [options.foveatedScreenSpaceError=true] Optimization option. Prioritize loading tiles in the center of the screen by temporarily raising the screen space error for tiles around the edge of the screen. Screen space error returns to normal once all the tiles in the center of the screen as determined by the {@link Cesium3DTilesetImplicit#foveatedConeSize} are loaded.
     * @param {Number} [options.foveatedConeSize=0.1] Optimization option. Used when {@link Cesium3DTilesetImplicit#foveatedScreenSpaceError} is true to control the cone size that determines which tiles are deferred. Tiles that are inside this cone are loaded immediately. Tiles outside the cone are potentially deferred based on how far outside the cone they are and their screen space error. This is controlled by {@link Cesium3DTilesetImplicit#foveatedInterpolationCallback} and {@link Cesium3DTilesetImplicit#foveatedMinimumScreenSpaceErrorRelaxation}. Setting this to 0.0 means the cone will be the line formed by the camera position and its view direction. Setting this to 1.0 means the cone encompasses the entire field of view of the camera, disabling the effect.
     * @param {Number} [options.foveatedMinimumScreenSpaceErrorRelaxation=0.0] Optimization option. Used when {@link Cesium3DTilesetImplicit#foveatedScreenSpaceError} is true to control the starting screen space error relaxation for tiles outside the foveated cone. The screen space error will be raised starting with tileset value up to {@link Cesium3DTilesetImplicit#maximumScreenSpaceError} based on the provided {@link Cesium3DTilesetImplicit#foveatedInterpolationCallback}.
     * @param {Cesium3DTilesetImplicit~foveatedInterpolationCallback} [options.foveatedInterpolationCallback=Math.lerp] Optimization option. Used when {@link Cesium3DTilesetImplicit#foveatedScreenSpaceError} is true to control how much to raise the screen space error for tiles outside the foveated cone, interpolating between {@link Cesium3DTilesetImplicit#foveatedMinimumScreenSpaceErrorRelaxation} and {@link Cesium3DTilesetImplicit#maximumScreenSpaceError}
     * @param {Number} [options.foveatedTimeDelay=0.2] Optimization option. Used when {@link Cesium3DTilesetImplicit#foveatedScreenSpaceError} is true to control how long in seconds to wait after the camera stops moving before deferred tiles start loading in. This time delay prevents requesting tiles around the edges of the screen when the camera is moving. Setting this to 0.0 will immediately request all tiles in any given view.
     * @param {Boolean} [options.skipLevelOfDetail=true] Optimization option. Determines if level of detail skipping should be applied during the traversal.
     * @param {Number} [options.baseScreenSpaceError=1024] When <code>skipLevelOfDetail</code> is <code>true</code>, the screen space error that must be reached before skipping levels of detail.
     * @param {Number} [options.skipScreenSpaceErrorFactor=16] When <code>skipLevelOfDetail</code> is <code>true</code>, a multiplier defining the minimum screen space error to skip. Used in conjunction with <code>skipLevels</code> to determine which tiles to load.
     * @param {Number} [options.skipLevels=1] When <code>skipLevelOfDetail</code> is <code>true</code>, a constant defining the minimum number of levels to skip when loading tiles. When it is 0, no levels are skipped. Used in conjunction with <code>skipScreenSpaceErrorFactor</code> to determine which tiles to load.
     * @param {Boolean} [options.immediatelyLoadDesiredLevelOfDetail=false] When <code>skipLevelOfDetail</code> is <code>true</code>, only tiles that meet the maximum screen space error will ever be downloaded. Skipping factors are ignored and just the desired tiles are loaded.
     * @param {Boolean} [options.loadSiblings=false] When <code>skipLevelOfDetail</code> is <code>true</code>, determines whether siblings of visible tiles are always downloaded during traversal.
     * @param {ClippingPlaneCollection} [options.clippingPlanes] The {@link ClippingPlaneCollection} used to selectively disable rendering the tileset.
     * @param {ClassificationType} [options.classificationType] Determines whether terrain, 3D Tiles or both will be classified by this tileset. See {@link Cesium3DTilesetImplicit#classificationType} for details about restrictions and limitations.
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid determining the size and shape of the globe.
     * @param {Object} [options.pointCloudShading] Options for constructing a {@link PointCloudShading} object to control point attenuation based on geometric error and lighting.
     * @param {Cartesian2} [options.imageBasedLightingFactor=new Cartesian2(1.0, 1.0)] Scales the diffuse and specular image-based lighting from the earth, sky, atmosphere and star skybox.
     * @param {Cartesian3} [options.lightColor] The color and intensity of the sunlight used to shade models.
     * @param {Number} [options.luminanceAtZenith=0.5] The sun's luminance at the zenith in kilo candela per meter squared to use for this model's procedural environment map.
     * @param {Cartesian3[]} [options.sphericalHarmonicCoefficients] The third order spherical harmonic coefficients used for the diffuse color of image-based lighting.
     * @param {String} [options.specularEnvironmentMaps] A URL to a KTX file that contains a cube map of the specular lighting and the convoluted specular mipmaps.
     * @param {String} [options.debugHeatmapTilePropertyName] The tile variable to colorize as a heatmap. All rendered tiles will be colorized relative to each other's specified variable value.
     * @param {Boolean} [options.debugFreezeFrame=false] For debugging only. Determines if only the tiles from last frame should be used for rendering.
     * @param {Boolean} [options.debugColorizeTiles=false] For debugging only. When true, assigns a random color to each tile.
     * @param {Boolean} [options.debugWireframe=false] For debugging only. When true, render's each tile's content as a wireframe.
     * @param {Boolean} [options.debugShowBoundingVolume=false] For debugging only. When true, renders the bounding volume for each tile.
     * @param {Boolean} [options.debugShowContentBoundingVolume=false] For debugging only. When true, renders the bounding volume for each tile's content.
     * @param {Boolean} [options.debugShowViewerRequestVolume=false] For debugging only. When true, renders the viewer request volume for each tile.
     * @param {Boolean} [options.debugShowGeometricError=false] For debugging only. When true, draws labels to indicate the geometric error of each tile.
     * @param {Boolean} [options.debugShowRenderingStatistics=false] For debugging only. When true, draws labels to indicate the number of commands, points, triangles and features for each tile.
     * @param {Boolean} [options.debugShowMemoryUsage=false] For debugging only. When true, draws labels to indicate the texture and geometry memory in megabytes used by each tile.
     * @param {Boolean} [options.debugShowUrl=false] For debugging only. When true, draws labels to indicate the url of each tile.
     *
     * @exception {DeveloperError} The tileset must be 3D Tiles version 0.0 or 1.0.
     *
     * @example
     * var tileset = scene.primitives.add(new Cesium.Cesium3DTilesetImplicit({
     *      url : 'http://localhost:8002/tilesets/Seattle/tileset.json'
     * }));
     *
     * @example
     * // Common setting for the skipLevelOfDetail optimization
     * var tileset = scene.primitives.add(new Cesium.Cesium3DTilesetImplicit({
     *      url : 'http://localhost:8002/tilesets/Seattle/tileset.json',
     *      skipLevelOfDetail : true,
     *      baseScreenSpaceError : 1024,
     *      skipScreenSpaceErrorFactor : 16,
     *      skipLevels : 1,
     *      immediatelyLoadDesiredLevelOfDetail : false,
     *      loadSiblings : false,
     *      cullWithChildrenBounds : true
     * }));
     *
     * @example
     * // Common settings for the dynamicScreenSpaceError optimization
     * var tileset = scene.primitives.add(new Cesium.Cesium3DTilesetImplicit({
     *      url : 'http://localhost:8002/tilesets/Seattle/tileset.json',
     *      dynamicScreenSpaceError : true,
     *      dynamicScreenSpaceErrorDensity : 0.00278,
     *      dynamicScreenSpaceErrorFactor : 4.0,
     *      dynamicScreenSpaceErrorHeightFalloff : 0.25
     * }));
     *
     * @see {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification|3D Tiles specification}
     */

    var subtreesPackedUint8ArraySizesQuad = [
        0,          // 0  Levels
        1,          // 1  Levels
        2,          // 2  Levels
        4,          // 3  Levels
        12,         // 4  Levels
        44,         // 5  Levels
        172,        // 6  Levels
        684,        // 7  Levels
        2732,       // 8  Levels
        10924,      // 9  Levels
        43692       // 10 Levels
    ];
    var subtreesPackedUint8ArraySizesOct = [
        0,          // 0  Levels
        1,          // 1  Levels
        2,          // 2  Levels
        10,         // 3  Levels
        74,         // 4  Levels
        586,        // 5  Levels
        4682,       // 6  Levels
        37450,      // 7  Levels
        299594,     // 8  Levels
        2396746,    // 9  Levels
        19173962    // 10 Levels
    ];
    var subtreesUint8ArraySizesQuad = [
        0,          // 0  Levels
        1,          // 1  Levels
        5,          // 2  Levels
        21,         // 3  Levels
        85,         // 4  Levels
        341,        // 5  Levels
        1365,       // 6  Levels
        5461,       // 7  Levels
        21845,      // 8  Levels
        87381,      // 9  Levels
        349525      // 10 Levels
    ];
    var subtreesUint8ArraySizesOct = [
        0,          // 0  Levels
        1,          // 1  Levels
        9,          // 2  Levels
        73,         // 3  Levels
        585,        // 4  Levels
        4681,       // 5  Levels
        37449,      // 6  Levels
        299593,     // 7  Levels
        2396745,    // 8  Levels
        19173961,   // 9  Levels
        153391689   // 10 Levels
    ];

    function Cesium3DTilesetImplicit(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        //>>includeStart('debug', pragmas.debug);
        Check.defined('options.url', options.url);
        //>>includeEnd('debug');

        this._url = undefined;
        this._basePath = undefined;
        this._root = undefined;
        this._tilingScheme = undefined;

        // TODO: Cache/Manager class that has some or all of these values as
        // well as any subtree precomputation (array sizes, sse sphere radii, etc)
        // this._subtreeCache = new Map(); // Holds the subtree availabilities. Key is the subtree's root 'd/x/y/z' (z==0 for quad tiles) in the tree and value is the Uint8Array subtree
        // this._tiles = new Map(); // Holds the subtree tiles, Key is the subtree's root 'd/x/y/z' (z==0 for quad tiles) in the tree and value is an Array of tiles (undefined spots are unavailable)
        this._subtreeCache = undefined; // Holds the subtree availabilities. Key is the subtree's root 'd/x/y/z' (z==0 for quad tiles) in the tree and value is the Uint8Array subtree
        // this._subtreeViewer = new ImplicitSubtreeViewer(this); // TODO: Make class with the toroidial multi dimensional array to make iteration easier, needs to update small portions every frame
        // I think there are two portions? ancestor portion 1d array and the normal portion which is a 3d array (fixed sizes on each level?) toroidial array?
        // what happens when sse changes? re-init the fixed size arrays? prevent going below some value in tileset (during the set)?

        // 1D array of LOD sphere radii. index 0 is the contentless tileset root, 1 is the content roots, so this array 1indexed array as opposed to 0indexed.
        // if the camera is within that distance you can process that 1indexed level.
        // for replacement refinement, tiles touched by this sphere on that level means that their children are required
        // addative can start from index 1 and it can just take the tile it touches on that level since it doesn't have the requirement of all children tiles loaded
        this._lodDistances = [];

        // Children have use their parents sphere radius
        // WHEN ADD: this var indicates content level (0 being content root) that can be accessed. The grid can start at the content root.
        // the sphere radius to use at each content level is _lodDistances[contentLevel] so the radius at the conent level of _maximumTraversalLevel is
        // _lodDistances[_maximumTraversalLevel], if the sphere check touches the tile on the corresponding level
        // it can be requested and rendered (assuming it is not culled)
        // WHEN REPLACE: this var indicates content level that can be accessed... but only through the parents.
        // the grid will need to start at tilesetroot. the indices determined
        // here will need to be converted to child indices for requests/rendering
        // can traverse content levels up to _maximumTraversalLevel - 1, i.e. the last parent level but
        // the sphere radius used at each parent level is _lodDistances[child's content level]
        // Ex: if tileset contentless root is within _lodDistances[_startLevel] it loads the tileset contentless root's children
        // in this case of REPLACE the radius test is checkif if the parent tile (the tile we are testing) should load all of its children (the radius we are using)
        // the children do not have to be within this radius. these children must be loaded but don't have to be rendered if they are culled by the planes
        // So ADD request/render tiles are the same but REPLACE has separate indices for request and render, request being a superset or looser than render.
        this._maximumTraversalLevel = 0;

        this._packedArraySizes = undefined;
        this._unpackedArraySizes = undefined;
        this._packedSize = 0;
        this._unpackedSize = 0;
        this._isOct = true;
        this._packedSubtrees = false;

        this._availabilityFolder = 'availability/'; // Pick something easier to spell, maybe a/
        this._asset = undefined; // Metadata for the entire tileset
        this._properties = undefined; // Metadata for per-model/point/etc properties
        this._geometricError = undefined; // Geometric error when the tree is not rendered at all
        this._geometricErrorContentRoot = undefined; // Geometric error when the tree is not rendered at all
        this._extensionsUsed = undefined;
        this._gltfUpAxis = undefined;
        this._cache = new Cesium3DTilesetCache();
        this._processingQueue = [];
        this._selectedTiles = [];
        this._emptyTiles = [];
        this._requestedTiles = [];
        this._selectedTilesToStyle = [];
        this._loadTimestamp = undefined;
        this._timeSinceLoad = 0.0;
        this._updatedVisibilityFrame = 0;
        this._extras = undefined;
        this._credits = undefined;

        this._cullWithChildrenBounds = defaultValue(options.cullWithChildrenBounds, true);
        this._allTilesAdditive = true;

        this._hasMixedContent = false;

        this._stencilClearCommand = undefined;
        this._backfaceCommands = new ManagedArray();

        this._maximumScreenSpaceError = defaultValue(options.maximumScreenSpaceError, 16);
        this._maximumMemoryUsage = defaultValue(options.maximumMemoryUsage, 512);

        this._styleEngine = new Cesium3DTileStyleEngine();

        this._modelMatrix = defined(options.modelMatrix) ? Matrix4.clone(options.modelMatrix) : Matrix4.clone(Matrix4.IDENTITY);

        this._statistics = new Cesium3DTilesetStatistics();
        this._statisticsLast = new Cesium3DTilesetStatistics();
        this._statisticsPerPass = new Array(Cesium3DTilePass.NUMBER_OF_PASSES);

        for (var i = 0; i < Cesium3DTilePass.NUMBER_OF_PASSES; ++i) {
            this._statisticsPerPass[i] = new Cesium3DTilesetStatistics();
        }

        this._requestedTilesInFlight = [];

        // this._maximumPriority = { foveatedFactor: -Number.MAX_VALUE, depth: -Number.MAX_VALUE, distance: -Number.MAX_VALUE, reverseScreenSpaceError: -Number.MAX_VALUE };
        // this._minimumPriority = { foveatedFactor: Number.MAX_VALUE, depth: Number.MAX_VALUE, distance: Number.MAX_VALUE, reverseScreenSpaceError: Number.MAX_VALUE };
        this._heatmap = new Cesium3DTilesetHeatmap(options.debugHeatmapTilePropertyName);

        this._traversals = [
            Cesium3DTilesetTraversalImplicit,
            Cesium3DTilesetMostDetailedTraversal
        ];

        /**
         * Optimization option. Don't request tiles that will likely be unused when they come back because of the camera's movement.
         *
         * @type {Boolean}
         * @default true
         */
        this.cullRequestsWhileMoving = defaultValue(options.cullRequestsWhileMoving, true);

        /**
         * Optimization option. Multiplier used in culling requests while moving. Larger is more aggressive culling, smaller less aggressive culling.
         *
         * @type {Number}
         * @default 60.0
         */
        this.cullRequestsWhileMovingMultiplier = defaultValue(options.cullRequestsWhileMovingMultiplier, 60.0);

        /**
         * Optimization option. If between (0.0, 0.5], tiles at or above the screen space error for the reduced screen resolution of <code>progressiveResolutionHeightFraction*screenHeight</code> will be prioritized first. This can help get a quick layer of tiles down while full resolution tiles continue to load.
         *
         * @type {Number}
         * @default 0.3
         */
        this.progressiveResolutionHeightFraction = CesiumMath.clamp(defaultValue(options.progressiveResolutionHeightFraction, 0.3), 0.0, 0.5);

        /**
         * Optimization option. Prefer loading of leaves first.
         *
         * @type {Boolean}
         * @default false
         */
        this.preferLeaves = defaultValue(options.preferLeaves, false);

        this._tilesLoaded = false;
        this._initialTilesLoaded = false;

        this._tileDebugLabels = undefined;

        this._readyPromise = when.defer();

        this._classificationType = options.classificationType;

        this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);

        this._initialClippingPlanesOriginMatrix = Matrix4.IDENTITY; // Computed from the tileset JSON.
        this._clippingPlanesOriginMatrix = undefined; // Combines the above with any run-time transforms.
        this._clippingPlanesOriginMatrixDirty = true;

        /**
         * Preload tiles when <code>tileset.show</code> is <code>false</code>. Loads tiles as if the tileset is visible but does not render them.
         *
         * @type {Boolean}
         * @default false
         */
        this.preloadWhenHidden = defaultValue(options.preloadWhenHidden, false);

        /**
         * Optimization option. Fetch tiles at the camera's flight destination while the camera is in flight.
         *
         * @type {Boolean}
         * @default true
         */
        this.preloadFlightDestinations = defaultValue(options.preloadFlightDestinations, true);
        this._pass = undefined; // Cesium3DTilePass

        /**
         * Optimization option. Whether the tileset should refine based on a dynamic screen space error. Tiles that are further
         * away will be rendered with lower detail than closer tiles. This improves performance by rendering fewer
         * tiles and making less requests, but may result in a slight drop in visual quality for tiles in the distance.
         * The algorithm is biased towards "street views" where the camera is close to the ground plane of the tileset and looking
         * at the horizon. In addition results are more accurate for tightly fitting bounding volumes like box and region.
         *
         * @type {Boolean}
         * @default false
         */
        this.dynamicScreenSpaceError = defaultValue(options.dynamicScreenSpaceError, false);

        /**
         * Optimization option. Prioritize loading tiles in the center of the screen by temporarily raising the
         * screen space error for tiles around the edge of the screen. Screen space error returns to normal once all
         * the tiles in the center of the screen as determined by the {@link Cesium3DTilesetImplicit#foveatedConeSize} are loaded.
         *
         * @type {Boolean}
         * @default true
         */
        this.foveatedScreenSpaceError = defaultValue(options.foveatedScreenSpaceError, true);
        this._foveatedConeSize = defaultValue(options.foveatedConeSize, 0.1);
        this._foveatedMinimumScreenSpaceErrorRelaxation = defaultValue(options.foveatedMinimumScreenSpaceErrorRelaxation, 0.0);

        /**
         * Gets a function that will update the foveated screen space error for a tile.
         *
         * @type {Cesium3DTilesetImplicit~foveatedInterpolationCallback} A callback to control how much to raise the screen space error for tiles outside the foveated cone, interpolating between {@link Cesium3DTilesetImplicit#foveatedMinimumScreenSpaceErrorRelaxation} and {@link Cesium3DTilesetImplicit#maximumScreenSpaceError}.
         */
        this.foveatedInterpolationCallback = defaultValue(options.foveatedInterpolationCallback, CesiumMath.lerp);

        /**
         * Optimization option. Used when {@link Cesium3DTilesetImplicit#foveatedScreenSpaceError} is true to control
         * how long in seconds to wait after the camera stops moving before deferred tiles start loading in.
         * This time delay prevents requesting tiles around the edges of the screen when the camera is moving.
         * Setting this to 0.0 will immediately request all tiles in any given view.
         *
         * @type {Number}
         * @default 0.2
         */
        this.foveatedTimeDelay = defaultValue(options.foveatedTimeDelay, 0.2);

        /**
         * A scalar that determines the density used to adjust the dynamic screen space error, similar to {@link Fog}. Increasing this
         * value has the effect of increasing the maximum screen space error for all tiles, but in a non-linear fashion.
         * The error starts at 0.0 and increases exponentially until a midpoint is reached, and then approaches 1.0 asymptotically.
         * This has the effect of keeping high detail in the closer tiles and lower detail in the further tiles, with all tiles
         * beyond a certain distance all roughly having an error of 1.0.
         * <p>
         * The dynamic error is in the range [0.0, 1.0) and is multiplied by <code>dynamicScreenSpaceErrorFactor</code> to produce the
         * final dynamic error. This dynamic error is then subtracted from the tile's actual screen space error.
         * </p>
         * <p>
         * Increasing <code>dynamicScreenSpaceErrorDensity</code> has the effect of moving the error midpoint closer to the camera.
         * It is analogous to moving fog closer to the camera.
         * </p>
         *
         * @type {Number}
         * @default 0.00278
         */
        this.dynamicScreenSpaceErrorDensity = 0.00278;

        /**
         * A factor used to increase the screen space error of tiles for dynamic screen space error. As this value increases less tiles
         * are requested for rendering and tiles in the distance will have lower detail. If set to zero, the feature will be disabled.
         *
         * @type {Number}
         * @default 4.0
         */
        this.dynamicScreenSpaceErrorFactor = 4.0;

        /**
         * A ratio of the tileset's height at which the density starts to falloff. If the camera is below this height the
         * full computed density is applied, otherwise the density falls off. This has the effect of higher density at
         * street level views.
         * <p>
         * Valid values are between 0.0 and 1.0.
         * </p>
         *
         * @type {Number}
         * @default 0.25
         */
        this.dynamicScreenSpaceErrorHeightFalloff = 0.25;

        this._dynamicScreenSpaceErrorComputedDensity = 0.0; // Updated based on the camera position and direction

        /**
         * Determines whether the tileset casts or receives shadows from each light source.
         * <p>
         * Enabling shadows has a performance impact. A tileset that casts shadows must be rendered twice, once from the camera and again from the light's point of view.
         * </p>
         * <p>
         * Shadows are rendered only when {@link Viewer#shadows} is <code>true</code>.
         * </p>
         *
         * @type {ShadowMode}
         * @default ShadowMode.ENABLED
         */
        this.shadows = defaultValue(options.shadows, ShadowMode.ENABLED);

        /**
         * Determines if the tileset will be shown.
         *
         * @type {Boolean}
         * @default true
         */
        this.show = defaultValue(options.show, true);

        /**
         * Defines how per-feature colors set from the Cesium API or declarative styling blend with the source colors from
         * the original feature, e.g. glTF material or per-point color in the tile.
         *
         * @type {Cesium3DTileColorBlendMode}
         * @default Cesium3DTileColorBlendMode.HIGHLIGHT
         */
        this.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;

        /**
         * Defines the value used to linearly interpolate between the source color and feature color when the {@link Cesium3DTilesetImplicit#colorBlendMode} is <code>MIX</code>.
         * A value of 0.0 results in the source color while a value of 1.0 results in the feature color, with any value in-between
         * resulting in a mix of the source color and feature color.
         *
         * @type {Number}
         * @default 0.5
         */
        this.colorBlendAmount = 0.5;

        /**
         * Options for controlling point size based on geometric error and eye dome lighting.
         * @type {PointCloudShading}
         */
        this.pointCloudShading = new PointCloudShading(options.pointCloudShading);

        this._pointCloudEyeDomeLighting = new PointCloudEyeDomeLighting();

        /**
         * The event fired to indicate progress of loading new tiles.  This event is fired when a new tile
         * is requested, when a requested tile is finished downloading, and when a downloaded tile has been
         * processed and is ready to render.
         * <p>
         * The number of pending tile requests, <code>numberOfPendingRequests</code>, and number of tiles
         * processing, <code>numberOfTilesProcessing</code> are passed to the event listener.
         * </p>
         * <p>
         * This event is fired at the end of the frame after the scene is rendered.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.loadProgress.addEventListener(function(numberOfPendingRequests, numberOfTilesProcessing) {
         *     if ((numberOfPendingRequests === 0) && (numberOfTilesProcessing === 0)) {
         *         console.log('Stopped loading');
         *         return;
         *     }
         *
         *     console.log('Loading: requests: ' + numberOfPendingRequests + ', processing: ' + numberOfTilesProcessing);
         * });
         */
        this.loadProgress = new Event();

        /**
         * The event fired to indicate that all tiles that meet the screen space error this frame are loaded. The tileset
         * is completely loaded for this view.
         * <p>
         * This event is fired at the end of the frame after the scene is rendered.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.allTilesLoaded.addEventListener(function() {
         *     console.log('All tiles are loaded');
         * });
         *
         * @see Cesium3DTilesetImplicit#tilesLoaded
         */
        this.allTilesLoaded = new Event();

        /**
         * The event fired to indicate that all tiles that meet the screen space error this frame are loaded. This event
         * is fired once when all tiles in the initial view are loaded.
         * <p>
         * This event is fired at the end of the frame after the scene is rendered.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.initialTilesLoaded.addEventListener(function() {
         *     console.log('Initial tiles are loaded');
         * });
         *
         * @see Cesium3DTilesetImplicit#allTilesLoaded
         */
        this.initialTilesLoaded = new Event();

        /**
         * The event fired to indicate that a tile's content was loaded.
         * <p>
         * The loaded {@link Cesium3DTileImplicit} is passed to the event listener.
         * </p>
         * <p>
         * This event is fired during the tileset traversal while the frame is being rendered
         * so that updates to the tile take effect in the same frame.  Do not create or modify
         * Cesium entities or primitives during the event listener.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.tileLoad.addEventListener(function(tile) {
         *     console.log('A tile was loaded.');
         * });
         */
        this.tileLoad = new Event();

        /**
         * The event fired to indicate that a tile's content was unloaded.
         * <p>
         * The unloaded {@link Cesium3DTileImplicit} is passed to the event listener.
         * </p>
         * <p>
         * This event is fired immediately before the tile's content is unloaded while the frame is being
         * rendered so that the event listener has access to the tile's content.  Do not create
         * or modify Cesium entities or primitives during the event listener.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.tileUnload.addEventListener(function(tile) {
         *     console.log('A tile was unloaded from the cache.');
         * });
         *
         * @see Cesium3DTilesetImplicit#maximumMemoryUsage
         * @see Cesium3DTilesetImplicit#trimLoadedTiles
         */
        this.tileUnload = new Event();

        /**
         * The event fired to indicate that a tile's content failed to load.
         * <p>
         * If there are no event listeners, error messages will be logged to the console.
         * </p>
         * <p>
         * The error object passed to the listener contains two properties:
         * <ul>
         * <li><code>url</code>: the url of the failed tile.</li>
         * <li><code>message</code>: the error message.</li>
         * </ul>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.tileFailed.addEventListener(function(error) {
         *     console.log('An error occurred loading tile: ' + error.url);
         *     console.log('Error: ' + error.message);
         * });
         */
        this.tileFailed = new Event();

        /**
         * This event fires once for each visible tile in a frame.  This can be used to manually
         * style a tileset.
         * <p>
         * The visible {@link Cesium3DTileImplicit} is passed to the event listener.
         * </p>
         * <p>
         * This event is fired during the tileset traversal while the frame is being rendered
         * so that updates to the tile take effect in the same frame.  Do not create or modify
         * Cesium entities or primitives during the event listener.
         * </p>
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * tileset.tileVisible.addEventListener(function(tile) {
         *     if (tile.content instanceof Cesium.Batched3DModel3DTileContent) {
         *         console.log('A Batched 3D Model tile is visible.');
         *     }
         * });
         *
         * @example
         * // Apply a red style and then manually set random colors for every other feature when the tile becomes visible.
         * tileset.style = new Cesium.Cesium3DTileStyle({
         *     color : 'color("red")'
         * });
         * tileset.tileVisible.addEventListener(function(tile) {
         *     var content = tile.content;
         *     var featuresLength = content.featuresLength;
         *     for (var i = 0; i < featuresLength; i+=2) {
         *         content.getFeature(i).color = Cesium.Color.fromRandom();
         *     }
         * });
         */
        this.tileVisible = new Event();

        /**
         * Optimization option. Determines if level of detail skipping should be applied during the traversal.
         * <p>
         * The common strategy for replacement-refinement traversal is to store all levels of the tree in memory and require
         * all children to be loaded before the parent can refine. With this optimization levels of the tree can be skipped
         * entirely and children can be rendered alongside their parents. The tileset requires significantly less memory when
         * using this optimization.
         * </p>
         *
         * @type {Boolean}
         * @default true
         */
        this.skipLevelOfDetail = defaultValue(options.skipLevelOfDetail, true);
        this._skipLevelOfDetail = this.skipLevelOfDetail;
        this._disableSkipLevelOfDetail = false;

        /**
         * The screen space error that must be reached before skipping levels of detail.
         * <p>
         * Only used when {@link Cesium3DTilesetImplicit#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Number}
         * @default 1024
         */
        this.baseScreenSpaceError = defaultValue(options.baseScreenSpaceError, 1024);

        /**
         * Multiplier defining the minimum screen space error to skip.
         * For example, if a tile has screen space error of 100, no tiles will be loaded unless they
         * are leaves or have a screen space error <code><= 100 / skipScreenSpaceErrorFactor</code>.
         * <p>
         * Only used when {@link Cesium3DTilesetImplicit#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Number}
         * @default 16
         */
        this.skipScreenSpaceErrorFactor = defaultValue(options.skipScreenSpaceErrorFactor, 16);

        /**
         * Constant defining the minimum number of levels to skip when loading tiles. When it is 0, no levels are skipped.
         * For example, if a tile is level 1, no tiles will be loaded unless they are at level greater than 2.
         * <p>
         * Only used when {@link Cesium3DTilesetImplicit#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Number}
         * @default 1
         */
        this.skipLevels = defaultValue(options.skipLevels, 1);

        /**
         * When true, only tiles that meet the maximum screen space error will ever be downloaded.
         * Skipping factors are ignored and just the desired tiles are loaded.
         * <p>
         * Only used when {@link Cesium3DTilesetImplicit#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.immediatelyLoadDesiredLevelOfDetail = defaultValue(options.immediatelyLoadDesiredLevelOfDetail, false);

        /**
         * Determines whether siblings of visible tiles are always downloaded during traversal.
         * This may be useful for ensuring that tiles are already available when the viewer turns left/right.
         * <p>
         * Only used when {@link Cesium3DTilesetImplicit#skipLevelOfDetail} is <code>true</code>.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.loadSiblings = defaultValue(options.loadSiblings, false);

        this._clippingPlanes = undefined;
        this.clippingPlanes = options.clippingPlanes;

        this._imageBasedLightingFactor = new Cartesian2(1.0, 1.0);
        Cartesian2.clone(options.imageBasedLightingFactor, this._imageBasedLightingFactor);

        /**
         * The color and intensity of the sunlight used to shade a model.
         * <p>
         * For example, disabling additional light sources by setting <code>model.imageBasedLightingFactor = new Cartesian2(0.0, 0.0)</code> will make the
         * model much darker. Here, increasing the intensity of the light source will make the model brighter.
         * </p>
         *
         * @type {Cartesian3}
         * @default undefined
         */
        this.lightColor = options.lightColor;

        /**
         * The sun's luminance at the zenith in kilo candela per meter squared to use for this model's procedural environment map.
         * This is used when {@link Cesium3DTilesetImplicit#specularEnvironmentMaps} and {@link Cesium3DTilesetImplicit#sphericalHarmonicCoefficients} are not defined.
         *
         * @type Number
         *
         * @default 0.5
         *
         */
        this.luminanceAtZenith = defaultValue(options.luminanceAtZenith, 0.5);

        /**
         * The third order spherical harmonic coefficients used for the diffuse color of image-based lighting. When <code>undefined</code>, a diffuse irradiance
         * computed from the atmosphere color is used.
         * <p>
         * There are nine <code>Cartesian3</code> coefficients.
         * The order of the coefficients is: L<sub>00</sub>, L<sub>1-1</sub>, L<sub>10</sub>, L<sub>11</sub>, L<sub>2-2</sub>, L<sub>2-1</sub>, L<sub>20</sub>, L<sub>21</sub>, L<sub>22</sub>
         * </p>
         *
         * These values can be obtained by preprocessing the environment map using the <code>cmgen</code> tool of
         * {@link https://github.com/google/filament/releases | Google's Filament project}. This will also generate a KTX file that can be
         * supplied to {@link Cesium3DTilesetImplicit#specularEnvironmentMaps}.
         *
         * @type {Cartesian3[]}
         * @demo {@link https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Image-Based Lighting.html|Sandcastle Image Based Lighting Demo}
         * @see {@link https://graphics.stanford.edu/papers/envmap/envmap.pdf|An Efficient Representation for Irradiance Environment Maps}
         */
        this.sphericalHarmonicCoefficients = options.sphericalHarmonicCoefficients;

        /**
         * A URL to a KTX file that contains a cube map of the specular lighting and the convoluted specular mipmaps.
         *
         * @demo {@link https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Image-Based Lighting.html|Sandcastle Image Based Lighting Demo}
         * @type {String}
         * @see Cesium3DTilesetImplicit#sphericalHarmonicCoefficients
         */
        this.specularEnvironmentMaps = options.specularEnvironmentMaps;

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * Determines if only the tiles from last frame should be used for rendering.  This
         * effectively "freezes" the tileset to the previous frame so it is possible to zoom
         * out and see what was rendered.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugFreezeFrame = defaultValue(options.debugFreezeFrame, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, assigns a random color to each tile.  This is useful for visualizing
         * what features belong to what tiles, especially with additive refinement where features
         * from parent tiles may be interleaved with features from child tiles.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugColorizeTiles = defaultValue(options.debugColorizeTiles, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, renders each tile's content as a wireframe.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugWireframe = defaultValue(options.debugWireframe, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, renders the bounding volume for each visible tile.  The bounding volume is
         * white if the tile has a content bounding volume or is empty; otherwise, it is red.  Tiles that don't meet the
         * screen space error and are still refining to their descendants are yellow.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, renders the bounding volume for each visible tile's content. The bounding volume is
         * blue if the tile has a content bounding volume; otherwise it is red.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowContentBoundingVolume = defaultValue(options.debugShowContentBoundingVolume, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, renders the viewer request volume for each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowViewerRequestVolume = defaultValue(options.debugShowViewerRequestVolume, false);

        this._tileDebugLabels = undefined;
        this.debugPickedTileLabelOnly = false;
        this.debugPickedTile = undefined;
        this.debugPickPosition = undefined;

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, draws labels to indicate the geometric error of each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowGeometricError = defaultValue(options.debugShowGeometricError, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, draws labels to indicate the number of commands, points, triangles and features of each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowRenderingStatistics = defaultValue(options.debugShowRenderingStatistics, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, draws labels to indicate the geometry and texture memory usage of each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowMemoryUsage = defaultValue(options.debugShowMemoryUsage, false);

        /**
         * This property is for debugging only; it is not optimized for production use.
         * <p>
         * When true, draws labels to indicate the url of each tile.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.debugShowUrl = defaultValue(options.debugShowUrl, false);
        this._resource = undefined;

        var that = this;
        var resource;
        var tilesetJson;
        var rootKey;
        when(options.url)
            .then(function(url) {
                var basePath;
                resource = Resource.createIfNeeded(url);
                that._resource = resource;

                // ion resources have a credits property we can use for additional attribution.
                that._credits = resource.credits;

                if (resource.extension === 'json') {
                    basePath = resource.getBaseUri(true);
                } else if (resource.isDataUri) {
                    basePath = '';
                }

                that._url = resource.url;
                that._basePath = basePath;

                return Cesium3DTilesetImplicit.loadJson(resource);
            })
            .then(function(result) {
                tilesetJson = result;
                var gltfUpAxis = defined(tilesetJson.asset.gltfUpAxis) ? Axis.fromName(tilesetJson.asset.gltfUpAxis) : Axis.Y;
                var asset = tilesetJson.asset;
                that._asset = asset;
                that._tilingScheme = tilesetJson.tilingScheme;
                that._properties = tilesetJson.properties;
                that._geometricError = tilesetJson.geometricError * 2;
                that._geometricErrorContentRoot = tilesetJson.geometricError;
                that._extensionsUsed = tilesetJson.extensionsUsed;
                that._gltfUpAxis = gltfUpAxis;
                that._extras = tilesetJson.extras;
                var extras = asset.extras;
                if (defined(extras) && defined(extras.cesium) && defined(extras.cesium.credits)) {
                    var extraCredits = extras.cesium.credits;
                    var credits = that._credits;
                    if (!defined(credits)) {
                        credits = [];
                        that._credits = credits;
                    }
                    for (var i = 0; i < extraCredits.length; ++i) {
                        var credit = extraCredits[i];
                        credits.push(new Credit(credit.html, credit.showOnScreen));
                    }
                }
            })
            .then(function() {
                if (!defined(that._tilingScheme)) {
                    return undefined;
                }

                var regex = /tileset\.json/;
                var isOct = that._tilingScheme.type === 'oct';
                that._isOct = isOct;
                that._packedArraySizes = isOct ? subtreesPackedUint8ArraySizesOct : subtreesPackedUint8ArraySizesQuad;
                that._unpackedArraySizes = isOct ? subtreesUint8ArraySizesOct : subtreesUint8ArraySizesQuad;
                var subtreeLevels = that._tilingScheme.subtreeLevels;
                that._unpackedSize = that._unpackedArraySizes[subtreeLevels];
                that._packedSize = that._packedArraySizes[subtreeLevels];

                var rootSubtreeUrls = that.getRootSubtreeUrls();
                //  TODO: support processing all root subtrees at the start
                var subtreeUrl = that._url.replace(regex, rootSubtreeUrls[0]);
                // var subtreeResource = Resource.createIfNeeded(subtreeUrl);
                // return Cesium3DTilesetImplicit.loadJson(subtreeResource);
                rootKey = that._tilingScheme.roots[0];
                if (!isOct) {
                    rootKey.push(0);
                }
                rootKey = new Cartesian4(rootKey[1], rootKey[2], rootKey[3], rootKey[0]);
                return Cesium3DTilesetImplicit.loadArrayBuffer(subtreeUrl);
            })
            .then(function(result) {
                var subtreeArrayBuffer = result;
                var hasSubtreeArray = defined(subtreeArrayBuffer);

                if (hasSubtreeArray) {
                    // TODO: add check to  make sure length correct given subdivision type and subtreeLevels
                    var tilingScheme = that._tilingScheme;
                    //TODO: REMOVE, JUST TESTING SOMETHING
                    // tilingScheme.refine = Cesium3DTileRefine.REPLACE;
                    that._allTilesAdditive = tilingScheme.refine === Cesium3DTileRefine.ADD;
                    // A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
                    // Get the basePath relative to the external tileset.
                    // var rootInfo = {
                    //     boundingVolume: tilingScheme.boundingVolume,
                    //     geometricError: that._geometricError,
                    //     content: undefined,
                    //     refine: tilingScheme.refine,
                    // };

                    that._subtreeCache = new SubtreeInfo(that);
                    that._root = that.updateTilesetFromSubtree(resource, subtreeArrayBuffer, rootKey);
                } else {
                    that._root = that.loadTileset(resource, tilesetJson);
                }

                // Save the original, untransformed bounding volume position so we can apply
                // the tile transform and model matrix at run time
                var rootBoundingVolume = hasSubtreeArray ? that._tilingScheme.boundingVolume : tilesetJson.root.boundingVolume;
                var boundingVolume = that._root.createBoundingVolume(rootBoundingVolume, Matrix4.IDENTITY);
                var clippingPlanesOrigin = boundingVolume.boundingSphere.center;
                // If this origin is above the surface of the earth
                // we want to apply an ENU orientation as our best guess of orientation.
                // Otherwise, we assume it gets its position/orientation completely from the
                // root tile transform and the tileset's model matrix
                var originCartographic = that._ellipsoid.cartesianToCartographic(clippingPlanesOrigin);
                if (defined(originCartographic) && (originCartographic.height > ApproximateTerrainHeights._defaultMinTerrainHeight)) {
                    that._initialClippingPlanesOriginMatrix = Transforms.eastNorthUpToFixedFrame(clippingPlanesOrigin);
                }
                that._clippingPlanesOriginMatrix = Matrix4.clone(that._initialClippingPlanesOriginMatrix);
                that._readyPromise.resolve(that);
            }).otherwise(function(error) {
                that._readyPromise.reject(error);
            });
    }

    defineProperties(Cesium3DTilesetImplicit.prototype, {
        /**
         * Gets the tileset's asset object property, which contains metadata about the tileset.
         * <p>
         * See the {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#reference-asset|asset schema reference}
         * in the 3D Tiles spec for the full set of properties.
         * </p>
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Object}
         * @readonly
         *
         * @exception {DeveloperError} The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.
         */
        asset : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this.ready) {
                    throw new DeveloperError('The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.');
                }
                //>>includeEnd('debug');

                return this._asset;
            }
        },
        /**
         * The {@link ClippingPlaneCollection} used to selectively disable rendering the tileset.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {ClippingPlaneCollection}
         */
        clippingPlanes : {
            get : function() {
                return this._clippingPlanes;
            },
            set : function(value) {
                ClippingPlaneCollection.setOwner(value, this, '_clippingPlanes');
            }
        },

        /**
         * Gets the tileset's properties dictionary object, which contains metadata about per-feature properties.
         * <p>
         * See the {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#reference-properties|properties schema reference}
         * in the 3D Tiles spec for the full set of properties.
         * </p>
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Object}
         * @readonly
         *
         * @exception {DeveloperError} The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.
         *
         * @example
         * console.log('Maximum building height: ' + tileset.properties.height.maximum);
         * console.log('Minimum building height: ' + tileset.properties.height.minimum);
         *
         * @see Cesium3DTileFeature#getProperty
         * @see Cesium3DTileFeature#setProperty
         */
        properties : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this.ready) {
                    throw new DeveloperError('The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.');
                }
                //>>includeEnd('debug');

                return this._properties;
            }
        },

        /**
         * When <code>true</code>, the tileset's root tile is loaded and the tileset is ready to render.
         * This is set to <code>true</code> right before {@link Cesium3DTilesetImplicit#readyPromise} is resolved.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Boolean}
         * @readonly
         *
         * @default false
         */
        ready : {
            get : function() {
                return defined(this._root);
            }
        },

        /**
         * Gets the promise that will be resolved when the tileset's root tile is loaded and the tileset is ready to render.
         * <p>
         * This promise is resolved at the end of the frame before the first frame the tileset is rendered in.
         * </p>
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Promise.<Cesium3DTilesetImplicit>}
         * @readonly
         *
         * @example
         * tileset.readyPromise.then(function(tileset) {
         *     // tile.properties is not defined until readyPromise resolves.
         *     var properties = tileset.properties;
         *     if (Cesium.defined(properties)) {
         *         for (var name in properties) {
         *             console.log(properties[name]);
         *         }
         *     }
         * });
         */
        readyPromise : {
            get : function() {
                return this._readyPromise.promise;
            }
        },

        /**
         * When <code>true</code>, all tiles that meet the screen space error this frame are loaded. The tileset is
         * completely loaded for this view.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Boolean}
         * @readonly
         *
         * @default false
         *
         * @see Cesium3DTilesetImplicit#allTilesLoaded
         */
        tilesLoaded : {
            get : function() {
                return this._tilesLoaded;
            }
        },

        /**
         * The url to a tileset JSON file.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {String}
         * @readonly
         */
        url : {
            get : function() {
                return this._url;
            }
        },

        /**
         * The base path that non-absolute paths in tileset JSON file are relative to.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {String}
         * @readonly
         * @deprecated
         */
        basePath : {
            get : function() {
                deprecationWarning('Cesium3DTilesetImplicit.basePath', 'Cesium3DTilesetImplicit.basePath has been deprecated. All tiles are relative to the url of the tileset JSON file that contains them. Use the url property instead.');
                return this._basePath;
            }
        },

        /**
         * The style, defined using the
         * {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling|3D Tiles Styling language},
         * applied to each feature in the tileset.
         * <p>
         * Assign <code>undefined</code> to remove the style, which will restore the visual
         * appearance of the tileset to its default when no style was applied.
         * </p>
         * <p>
         * The style is applied to a tile before the {@link Cesium3DTilesetImplicit#tileVisible}
         * event is raised, so code in <code>tileVisible</code> can manually set a feature's
         * properties (e.g. color and show) after the style is applied. When
         * a new style is assigned any manually set properties are overwritten.
         * </p>
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Cesium3DTileStyle}
         *
         * @default undefined
         *
         * @example
         * tileset.style = new Cesium.Cesium3DTileStyle({
         *    color : {
         *        conditions : [
         *            ['${Height} >= 100', 'color("purple", 0.5)'],
         *            ['${Height} >= 50', 'color("red")'],
         *            ['true', 'color("blue")']
         *        ]
         *    },
         *    show : '${Height} > 0',
         *    meta : {
         *        description : '"Building id ${id} has height ${Height}."'
         *    }
         * });
         *
         * @see {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling|3D Tiles Styling language}
         */
        style : {
            get : function() {
                return this._styleEngine.style;
            },
            set : function(value) {
                this._styleEngine.style = value;
            }
        },

        /**
         * The maximum screen space error used to drive level of detail refinement.  This value helps determine when a tile
         * refines to its descendants, and therefore plays a major role in balancing performance with visual quality.
         * <p>
         * A tile's screen space error is roughly equivalent to the number of pixels wide that would be drawn if a sphere with a
         * radius equal to the tile's <b>geometric error</b> were rendered at the tile's position. If this value exceeds
         * <code>maximumScreenSpaceError</code> the tile refines to its descendants.
         * </p>
         * <p>
         * Depending on the tileset, <code>maximumScreenSpaceError</code> may need to be tweaked to achieve the right balance.
         * Higher values provide better performance but lower visual quality.
         * </p>
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Number}
         * @default 16
         *
         * @exception {DeveloperError} <code>maximumScreenSpaceError</code> must be greater than or equal to zero.
         */
        maximumScreenSpaceError : {
            get : function() {
                return this._maximumScreenSpaceError;
            },
            set : function(value) {
                //>>includeStart('debug', pragmas.debug);
                Check.typeOf.number.greaterThanOrEquals('maximumScreenSpaceError', value, 0);
                //>>includeEnd('debug');

                this._maximumScreenSpaceError = value;
            }
        },

        /**
         * The maximum amount of GPU memory (in MB) that may be used to cache tiles. This value is estimated from
         * geometry, textures, and batch table textures of loaded tiles. For point clouds, this value also
         * includes per-point metadata.
         * <p>
         * Tiles not in view are unloaded to enforce this.
         * </p>
         * <p>
         * If decreasing this value results in unloading tiles, the tiles are unloaded the next frame.
         * </p>
         * <p>
         * If tiles sized more than <code>maximumMemoryUsage</code> are needed
         * to meet the desired screen space error, determined by {@link Cesium3DTilesetImplicit#maximumScreenSpaceError},
         * for the current view, then the memory usage of the tiles loaded will exceed
         * <code>maximumMemoryUsage</code>.  For example, if the maximum is 256 MB, but
         * 300 MB of tiles are needed to meet the screen space error, then 300 MB of tiles may be loaded.  When
         * these tiles go out of view, they will be unloaded.
         * </p>
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Number}
         * @default 512
         *
         * @exception {DeveloperError} <code>maximumMemoryUsage</code> must be greater than or equal to zero.
         * @see Cesium3DTilesetImplicit#totalMemoryUsageInBytes
         */
        maximumMemoryUsage : {
            get : function() {
                return this._maximumMemoryUsage;
            },
            set : function(value) {
                //>>includeStart('debug', pragmas.debug);
                Check.typeOf.number.greaterThanOrEquals('value', value, 0);
                //>>includeEnd('debug');

                this._maximumMemoryUsage = value;
            }
        },

        /**
         * The root tile.
         *
         * @memberOf Cesium3DTilesetImplicit.prototype
         *
         * @type {Cesium3DTileImplicit}
         * @readonly
         *
         * @exception {DeveloperError} The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.
         */
        root : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this.ready) {
                    throw new DeveloperError('The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.');
                }
                //>>includeEnd('debug');

                return this._root;
            }
        },

        /**
         * The tileset's bounding sphere.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {BoundingSphere}
         * @readonly
         *
         * @exception {DeveloperError} The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.
         *
         * @example
         * var tileset = viewer.scene.primitives.add(new Cesium.Cesium3DTilesetImplicit({
         *     url : 'http://localhost:8002/tilesets/Seattle/tileset.json'
         * }));
         *
         * tileset.readyPromise.then(function(tileset) {
         *     // Set the camera to view the newly added tileset
         *     viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
         * });
         */
        boundingSphere : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this.ready) {
                    throw new DeveloperError('The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.');
                }
                //>>includeEnd('debug');

                this._root.updateTransform(this._modelMatrix);
                return this._root.boundingSphere;
            }
        },

        /**
         * A 4x4 transformation matrix that transforms the entire tileset.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Matrix4}
         * @default Matrix4.IDENTITY
         *
         * @example
         * // Adjust a tileset's height from the globe's surface.
         * var heightOffset = 20.0;
         * var boundingSphere = tileset.boundingSphere;
         * var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
         * var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
         * var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
         * var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
         * tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
         */
        modelMatrix : {
            get : function() {
                return this._modelMatrix;
            },
            set : function(value) {
                this._modelMatrix = Matrix4.clone(value, this._modelMatrix);
            }
        },

        /**
         * Returns the time, in milliseconds, since the tileset was loaded and first updated.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Number}
         * @readonly
         */
        timeSinceLoad : {
            get : function() {
                return this._timeSinceLoad;
            }
        },

        /**
         * The total amount of GPU memory in bytes used by the tileset. This value is estimated from
         * geometry, texture, and batch table textures of loaded tiles. For point clouds, this value also
         * includes per-point metadata.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Number}
         * @readonly
         *
         * @see Cesium3DTilesetImplicit#maximumMemoryUsage
         */
        totalMemoryUsageInBytes : {
            get : function() {
                var statistics = this._statistics;
                return statistics.texturesByteLength + statistics.geometryByteLength + statistics.batchTableByteLength;
            }
        },

        /**
         * @private
         */
        clippingPlanesOriginMatrix : {
            get : function() {
                if (!defined(this._clippingPlanesOriginMatrix)) {
                    return Matrix4.IDENTITY;
                }

                if (this._clippingPlanesOriginMatrixDirty) {
                    Matrix4.multiply(this.root.computedTransform, this._initialClippingPlanesOriginMatrix, this._clippingPlanesOriginMatrix);
                    this._clippingPlanesOriginMatrixDirty = false;
                }

                return this._clippingPlanesOriginMatrix;
            }
        },

        /**
         * @private
         */
        styleEngine : {
            get : function() {
                return this._styleEngine;
            }
        },

        /**
         * @private
         */
        statistics : {
            get : function() {
                return this._statistics;
            }
        },

        /**
         * Determines whether terrain, 3D Tiles or both will be classified by this tileset.
         * <p>
         * This option is only applied to tilesets containing batched 3D models, geometry data, or vector data. Even when undefined, vector data and geometry data
         * must render as classifications and will default to rendering on both terrain and other 3D Tiles tilesets.
         * </p>
         * <p>
         * When enabled for batched 3D model tilesets, there are a few requirements/limitations on the glTF:
         * <ul>
         *     <li>POSITION and _BATCHID semantics are required.</li>
         *     <li>All indices with the same batch id must occupy contiguous sections of the index buffer.</li>
         *     <li>All shaders and techniques are ignored. The generated shader simply multiplies the position by the model-view-projection matrix.</li>
         *     <li>The only supported extensions are CESIUM_RTC and WEB3D_quantized_attributes.</li>
         *     <li>Only one node is supported.</li>
         *     <li>Only one mesh per node is supported.</li>
         *     <li>Only one primitive per mesh is supported.</li>
         * </ul>
         * </p>
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {ClassificationType}
         * @default undefined
         *
         * @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
         * @readonly
         */
        classificationType : {
            get : function() {
                return this._classificationType;
            }
        },

        /**
         * Gets an ellipsoid describing the shape of the globe.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Ellipsoid}
         * @readonly
         */
        ellipsoid : {
            get : function() {
                return this._ellipsoid;
            }
        },

        /**
         * Optimization option. Used when {@link Cesium3DTilesetImplicit#foveatedScreenSpaceError} is true to control the cone size that determines which tiles are deferred.
         * Tiles that are inside this cone are loaded immediately. Tiles outside the cone are potentially deferred based on how far outside the cone they are and {@link Cesium3DTilesetImplicit#foveatedInterpolationCallback} and {@link Cesium3DTilesetImplicit#foveatedMinimumScreenSpaceErrorRelaxation}.
         * Setting this to 0.0 means the cone will be the line formed by the camera position and its view direction. Setting this to 1.0 means the cone encompasses the entire field of view of the camera, essentially disabling the effect.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Number}
         * @default 0.3
         */
        foveatedConeSize : {
            get : function() {
                return this._foveatedConeSize;
            },
            set : function(value) {
                //>>includeStart('debug', pragmas.debug);
                Check.typeOf.number.greaterThanOrEquals('foveatedConeSize', value, 0.0);
                Check.typeOf.number.lessThanOrEquals('foveatedConeSize', value, 1.0);
                //>>includeEnd('debug');

                this._foveatedConeSize = value;
            }
        },

        /**
         * Optimization option. Used when {@link Cesium3DTilesetImplicit#foveatedScreenSpaceError} is true to control the starting screen space error relaxation for tiles outside the foveated cone.
         * The screen space error will be raised starting with this value up to {@link Cesium3DTilesetImplicit#maximumScreenSpaceError} based on the provided {@link Cesium3DTilesetImplicit#foveatedInterpolationCallback}.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Number}
         * @default 0.0
         */
        foveatedMinimumScreenSpaceErrorRelaxation : {
            get : function() {
                return this._foveatedMinimumScreenSpaceErrorRelaxation;
            },
            set : function(value) {
                //>>includeStart('debug', pragmas.debug);
                Check.typeOf.number.greaterThanOrEquals('foveatedMinimumScreenSpaceErrorRelaxation', value, 0.0);
                Check.typeOf.number.lessThanOrEquals('foveatedMinimumScreenSpaceErrorRelaxation', value, this.maximumScreenSpaceError);
                //>>includeEnd('debug');

                this._foveatedMinimumScreenSpaceErrorRelaxation = value;
            }
        },

        /**
         * Returns the <code>extras</code> property at the top-level of the tileset JSON, which contains application specific metadata.
         * Returns <code>undefined</code> if <code>extras</code> does not exist.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @exception {DeveloperError} The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.
         *
         * @type {*}
         * @readonly
         *
         * @see {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#specifying-extensions-and-application-specific-extras|Extras in the 3D Tiles specification.}
         */
        extras : {
            get : function() {
                //>>includeStart('debug', pragmas.debug);
                if (!this.ready) {
                    throw new DeveloperError('The tileset is not loaded.  Use Cesium3DTilesetImplicit.readyPromise or wait for Cesium3DTilesetImplicit.ready to be true.');
                }
                //>>includeEnd('debug');

                return this._extras;
            }
        },

        /**
         * Cesium adds lighting from the earth, sky, atmosphere, and star skybox. This cartesian is used to scale the final
         * diffuse and specular lighting contribution from those sources to the final color. A value of 0.0 will disable those light sources.
         *
         * @memberof Cesium3DTilesetImplicit.prototype
         *
         * @type {Cartesian2}
         * @default Cartesian2(1.0, 1.0)
         */
        imageBasedLightingFactor : {
            get : function() {
                return this._imageBasedLightingFactor;
            },
            set : function(value) {
                //>>includeStart('debug', pragmas.debug);
                Check.typeOf.object('imageBasedLightingFactor', value);
                Check.typeOf.number.greaterThanOrEquals('imageBasedLightingFactor.x', value.x, 0.0);
                Check.typeOf.number.lessThanOrEquals('imageBasedLightingFactor.x', value.x, 1.0);
                Check.typeOf.number.greaterThanOrEquals('imageBasedLightingFactor.y', value.y, 0.0);
                Check.typeOf.number.lessThanOrEquals('imageBasedLightingFactor.y', value.y, 1.0);
                //>>includeEnd('debug');
                Cartesian2.clone(value, this._imageBasedLightingFactor);
            }
        }
    });

    var rootDistance = -1;
    /**
     * Updates the _maximumTraversalLevel
     *
     * @private
     */
    Cesium3DTilesetImplicit.prototype.updateTraversalInfo = function(frameState) {
        // find the distnace to the tileset contentless root
        // use that that determine maximumTreversalDepth (the first index in _lodDistances that fails)

        var distance = this._root._distanceToCamera;

        var length = this._lodDistances.length;
        var lodDistances = this._lodDistances;
        this._maximumTraversalLevel = length - 1;
        var tilesetStartLevel = this._startLevel;
        var i;
        for (i = tilesetStartLevel; i < length; i++) {
            if (lodDistances[i] < distance) {
                this._maximumTraversalLevel = i - 1;
                break;
            }
        }

        if (Math.abs(rootDistance - distance) > CesiumMath.EPSILON2) {
            console.log('root dist ' + distance);
            console.log('max lvl ' + this._maximumTraversalLevel);
            rootDistance = distance;
        }
    };

    /**
     * Updates the _lodDistances array with LOD sphere radii from the camera to
     * pull in tiles on different levels of the tree
     *
     * @private
     */
    var lodDistancesAreInit = false;
    Cesium3DTilesetImplicit.prototype.updateLODDistances = function(frameState) {
        // TODO: when to update this based on camera, context, and  max gerror changes?
        var lodDistances = this._lodDistances;
        var length = lodDistances.length;
        var height = frameState.context.drawingBufferHeight;
        var sseDenominator = frameState.camera.frustum.sseDenominator;
        var factor = height / (this._maximumScreenSpaceError * sseDenominator);
        var i, lodDistance, gErrorOnLevel;
        // var startingGError = this._geometricErrorContentRoot;
        var startingGError = this._geometricError;
        var base = this.getGeomtricErrorBase();
        var tilesetStartLevel = this._startLevel;
        // var useChildSphere = this._allTilesAdditive ? 0 : 1; // ad to pow exponent
        for (i = tilesetStartLevel; i < length; i++) {
            gErrorOnLevel = startingGError / Math.pow(base, i - tilesetStartLevel);
            lodDistance = gErrorOnLevel * factor;
            lodDistances[i] = lodDistance;
        }

        if (!lodDistancesAreInit) {
            for (i = 0; i < length; i++) {
                console.log('lodDistance ' + i + ' ' + lodDistances[i]);
            }
            lodDistancesAreInit = true;
        }
    };

    /**
     * Inits the _lodDistances array so that it's the proper size
     *
     * @private
     */
    Cesium3DTilesetImplicit.prototype.initLODDistances = function() {
        // TODO: when to update this based on camera, context, and  max gerror changes?
        var lodDistances = this._lodDistances;
        var tilingScheme = this._tilingScheme;
        // +2 to get the the contentless tileset root as well as all the content levels (the other +1), though may not need
        // 0 being the contentless tileset root, 1 being the root nodes
        // var length = tilingScheme.lastLevel - this._startLevel + 2;
        var length = tilingScheme.lastLevel + 1;
        var i;
        for (i = 0; i < length; i++) {
            lodDistances.push(-1);
        }
    };

    /**
     * Provides a hook to override the method used to request the tileset json
     * useful when fetching tilesets from remote servers
     * @param {Resource|String} tilesetUrl The url of the json file to be fetched
     * @returns {Promise.<Object>} A promise that resolves with the fetched json data
     */
    Cesium3DTilesetImplicit.loadJson = function(tilesetUrl) {
        var resource = Resource.createIfNeeded(tilesetUrl);
        return resource.fetchJson();
    };

    /**
     * Provides a hook to override the method used to request the tileset json
     * useful when fetching tilesets from remote servers
     * @param {Resource|String} tilesetUrl The url of the json file to be fetched
     * @returns {Promise.<Object>} A promise that resolves with the fetched json data
     */
    Cesium3DTilesetImplicit.loadArrayBuffer = function(tilesetUrl) {
        var resource = Resource.createIfNeeded(tilesetUrl);
        return resource.fetchArrayBuffer();
    };

    /**
     * Returns an array of the root subtree urls
     */
    Cesium3DTilesetImplicit.prototype.getRootSubtreeUrls = function() {
        var tilingScheme =  this._tilingScheme;
        var isOct = this._isOct;
        var rootKeys = tilingScheme.roots;
        var rootKeysLength = rootKeys.length;
        var rootSubtreeUrls = [];
        var availabilityFolder = this._availabilityFolder;
        var key, url, i;

        for (i = 0; i< rootKeysLength; i++) {
            key = rootKeys[i];
            url = isOct ?
                availabilityFolder + key[0] + '/' + key[1] + '/' + key[2] + '/' + key[3] :
                availabilityFolder + key[0] + '/' + key[1] + '/' + key[2];

            rootSubtreeUrls.push(url);
        }
        return rootSubtreeUrls;
    };

    /**
     * Marks the tileset's {@link Cesium3DTilesetImplicit#style} as dirty, which forces all
     * features to re-evaluate the style in the next frame each is visible.
     */
    Cesium3DTilesetImplicit.prototype.makeStyleDirty = function() {
        this._styleEngine.makeDirty();
    };

    // /**
    //  * update _available
    //  */
    // Cesium3DTilesetImplicit.prototype.updateAvailable = function(available) {
    //     // If we don't have one yet just assign and return
    //     if (!defined(this._available)) {
    //         this._available = available;
    //         return;
    //     }
    //
    //     var length = available.length;
    //     var tilesetAvailable = this._available;
    //     var array = [];
    //     var i;
    //     for (i = 0; i < length; ++i) {
    //         array = available[i];
    //
    //         if (tilesetAvailable.length < (i + 1)) {
    //             // level info doesn't exist yet, make an empty entry
    //             tilesetAvailable.push(array);
    //             continue;
    //         } else if (array.length === 0) {
    //             // No addtional info for this level, continue.
    //             continue;
    //         } else {
    //             // Has addtional info, concat.
    //             tilesetAvailable[i].concat(array);
    //         }
    //     }
    // }

    Cesium3DTilesetImplicit.prototype.deriveImplicitBounds = function(rootTile, x, y, z, level) {
        var tilingScheme = this._tilingScheme;
        var headCount = tilingScheme.headCount;
        var rootXCount = headCount[0];
        var rootYCount = headCount[1];
        var rootZCount = headCount[2];
        var xTiles = rootXCount * (1 << level);
        var yTiles = rootYCount * (1 << level);

        var isOct = this._isOct;
        var zTiles = isOct ? rootZCount * (1 << level) : 1;

        var bounds = tilingScheme.boundingVolume;
        if (defined(bounds.region)) {
            var TWO_PI = Math.PI * 2;
            var PI_OVER_TWO = Math.PI / 2;

            var west = ((x / xTiles) * TWO_PI) - Math.PI;
            var east = (((x + 1) / xTiles) * TWO_PI) - Math.PI;

            // XY origin starts in upper left of the 2D map so north south calc is slightly different
            var north = ((y / yTiles) * -Math.PI) + PI_OVER_TWO;
            var south = (((y + 1) / yTiles) * -Math.PI) + PI_OVER_TWO;

            var boundsMinimumHeight = bounds.region[4];
            var boundsMaximumHeight = bounds.region[5];
            var heightRange = boundsMaximumHeight - boundsMinimumHeight;
            var minimumHeight = ((z / zTiles) * heightRange) + boundsMinimumHeight;
            var maximumHeight = (((z + 1) / zTiles) * heightRange) + boundsMinimumHeight;

            return { region: [
                west,
                south,
                east,
                north,
                minimumHeight,
                maximumHeight
            ]};
        } else if (defined(bounds.box)) {
            // x is to the right y is up and z points at face
            // 0 0 0 is lower left bottom

            // Very likely local space but to play it safe just do the explicit calculation.
            var center = bounds.box.slice(0,3);
            var halfAxes = bounds.box.slice(3,12);
            // Downstream from future can't do static scratch var
            var boxCenter = new Cartesian3();
            var halfX = new Cartesian3();
            var halfY = new Cartesian3();
            var halfZ = new Cartesian3();

            if (halfAxes[1] === 0 &&
                halfAxes[2] === 0 &&
                halfAxes[3] === 0 &&
                halfAxes[5] === 0 &&
                halfAxes[6] === 0 &&
                halfAxes[7] === 0) {
                // (want untransformed local for precision) and split it

                var minX = center[0] - halfAxes[0];
                var minY = center[1] - halfAxes[4];
                var minZ = center[2] - halfAxes[8];

                halfX.x = halfAxes[0] / xTiles;
                halfY.y = halfAxes[4] / yTiles;
                halfZ.z = halfAxes[8] / zTiles;

                boxCenter.x = halfX.x * (2 * x + 1) + minX;
                boxCenter.y = halfY.y * (2 * y + 1) + minY;
                boxCenter.z = halfZ.z * (2 * z + 1) + minZ;
            } else {
                // var halfAxesX = new Cartesian3();
                // var halfAxesY = new Cartesian3();
                // var halfAxesZ = new Cartesian3();
            }

            return { box: [
                boxCenter.x,
                boxCenter.y,
                boxCenter.z,

                halfX.x,
                halfX.y,
                halfX.z,

                halfY.x,
                halfY.y,
                halfY.z,

                halfZ.x,
                halfZ.y,
                halfZ.z
            ]};
        }

        console.log('no implementation for this bounding box type at the moment');

        return bounds;
    };

    // Cesium3DTilesetImplicit.prototype.anyChildrenAvailable = function(parentX, parentY, parentZ, parentLevel) {
    //     var isOct = this._isOct;
    //     var startX = parentX * 2;
    //     var startY = parentY * 2;
    //     var startZ = isOct ? parentZ * 2 : 0;
    //     var endX = startX + 1;
    //     var endY = startY + 1;
    //     var endZ = isOct ? startZ + 1 : 0;
    //
    //     var level = parentLevel + 1;
    //     if (level > (this._available.length - 1)) {
    //         return false ;
    //     }
    //
    //     for (var z = startZ; z <= endZ; ++z) {
    //         for (var x = startX; x <= endX; ++x) {
    //             for (var y = startY; y <= endY; ++y) {
    //                 if (this.isTileAvailable(x, y, z, level)) {
    //                     return true;
    //                 }
    //             }
    //         }
    //     }
    //
    //     return false;
    // };

    // Cesium3DTilesetImplicit.prototype.anyChildrenAvailableSubtree = function(parentX, parentY, parentZ, parentLevel) {
    //     var isOct = this._isOct;
    //     var startX = parentX * 2;
    //     var startY = parentY * 2;
    //     var startZ = isOct ? parentZ * 2 : 0;
    //     var endX = startX + 1;
    //     var endY = startY + 1;
    //     var endZ = isOct ? startZ + 1 : 0;
    //
    //     var level = parentLevel + 1;
    //     // if (level > (this._available.length - 1)) {
    //     //     return false ;
    //     // }
    //
    //     var result;
    //     for (var z = startZ; z <= endZ; ++z) {
    //         for (var x = startX; x <= endX; ++x) {
    //             for (var y = startY; y <= endY; ++y) {
    //                 result = this.isTileAvailableTreeKey(x, y, z, level);
    //                 if (result.isAvailable) {
    //                     return true;
    //                 }
    //             }
    //         }
    //     }
    //
    //     return false;
    // };

    // Cesium3DTilesetImplicit.prototype.derivedImplicitGeometricError = function(parent, x, y, z, xTiles, yTiles) {
    //     var anyChildrenAvailable = !defined(parent.treeKey) ? true : this.anyChildrenAvailableSubtree(x, y, z, parent.treeKey.w + 1); // parent key depth + 1 is this tiles depth, we want to see if this tile has any children for seting gError to 0
    //     return anyChildrenAvailable ? (parent.geometricError / Math.sqrt(xTiles * yTiles)) : 0;
    // };

    // Cesium3DTilesetImplicit.prototype.getSubtreeRootKey = function(x, y, z, level) {
    //     // Given the xyz level find the nearest subtree root key
    //     var subtreeLevels = this._tilingScheme.subtreeLevels;
    //     var subtreeLevels0Indexed = subtreeLevels -  1;
    //     var subtreeRootLevel = Math.floor(level / subtreeLevels0Indexed);
    //     subtreeRootLevel -= (level % subtreeLevels === 0) ? 1 : 0; // Because there is overlap between subtree roots and their parents last level, take the previous subtree when on the overlap level
    //     var subtreeLevel = level - subtreeRootLevel;
    //     var subtreeRootKey = {
    //         d: subtreeRootLevel,
    //         x: x >> subtreeLevel,
    //         y: y >> subtreeLevel,
    //         z: z >> subtreeLevel
    //     };
    //     return subtreeRootKey;
    // };

    Cesium3DTilesetImplicit.prototype.getSubtreeInfoFromSubtreeIndexAndRootKey = function(subtreeIndex, subtreeRootKey) {
        var arraySizes = this._unpackedArraySizes;

        var subtreeLevel = 0;
        var i = 0;
        var indexOffsetToFirstByteOnLevel = 0;

        var subtreeLevels = this._tilingScheme.subtreeLevels;
        for (i = 0; i <= subtreeLevels; i++) {
            if (subtreeIndex < arraySizes[i]) {
                subtreeLevel = Math.max(i - 1, 0);
                indexOffsetToFirstByteOnLevel = arraySizes[subtreeLevel];
                break;
            }
        }

        var tileIndexOnLevel = subtreeIndex - indexOffsetToFirstByteOnLevel;
        var subtreeKey = new Cartesian4(0, 0, 0, subtreeLevel);
        var isOct = this._isOct;

        var dimOnLevel = (1 << subtreeLevel);
        var dimOnLevelSqrd = dimOnLevel * dimOnLevel;
        subtreeKey.z = isOct ? Math.floor(tileIndexOnLevel / dimOnLevelSqrd) : 0;
        var zJump = subtreeKey.z * dimOnLevelSqrd;
        var remaining = tileIndexOnLevel - zJump;
        subtreeKey.y = Math.floor(remaining / dimOnLevel);
        var yJump = subtreeKey.y * dimOnLevel;
        remaining -= yJump;
        subtreeKey.x = remaining;

        var treeKey = new Cartesian4(0, 0, 0, subtreeRootKey.w + subtreeLevel);
        var shift = subtreeKey.w;
        treeKey.x = (subtreeRootKey.x << shift) + subtreeKey.x;
        treeKey.y = (subtreeRootKey.y << shift) + subtreeKey.y;
        treeKey.z = (subtreeRootKey.z << shift) + subtreeKey.z;

        return {
            treeKey : treeKey,
            subtreeKey : subtreeKey
        };
    };

    Cesium3DTilesetImplicit.prototype.getSubtreeInfoFromTreeKey = function(x, y, z, level) {
        // Given the xyz level find the nearest subtree root key
        var subtreeLevels = this._tilingScheme.subtreeLevels;
        var subtreeLevels0Indexed = subtreeLevels -  1;
        var subtreesDownTree = Math.floor(level / subtreeLevels0Indexed);
        var subtreeRootLevel = subtreesDownTree * subtreeLevels0Indexed;
        var onLastLevel = (level % subtreeLevels0Indexed) === 0 && (level !== 0) && (subtreeRootLevel !== 0);
        subtreeRootLevel -= onLastLevel ? 1 : 0; // Because there is overlap between subtree roots and their parents last level, take the previous subtree when on the overlap level
        subtreeRootLevel = Math.max(subtreeRootLevel, this._tilingScheme.roots[0][0]);
        var subtreeLevel = level - subtreeRootLevel;

        var subtreeRootKey = new Cartesian4(
            x >> subtreeLevel,
            y >> subtreeLevel,
            z >> subtreeLevel,
            subtreeRootLevel
        );
        var shiftX = (subtreeRootKey.x << subtreeLevel);
        var shiftY = (subtreeRootKey.y << subtreeLevel);
        var shiftZ = (subtreeRootKey.z << subtreeLevel);
        var subtreeKey = new Cartesian4(
            ((x - shiftX)),
            ((y - shiftY)),
            ((z - shiftZ)),
            subtreeLevel
        );

        var dimOnLevel = (1 << subtreeLevel);
        var dimOnLevelSqrd = dimOnLevel * dimOnLevel;

        var arraySizes = this._unpackedArraySizes;

        // Update the bit that corresponds to this rel subtree key (d, x, y, z)
        var indexOffsetToFirstByteOnLevel = arraySizes[subtreeLevel];
        // Treating the level as a linear array, what is the tiles index on this subtree level
        var tileIndexOnLevel = subtreeKey.z * dimOnLevelSqrd + subtreeKey.y * dimOnLevel + subtreeKey.x;
        var index = indexOffsetToFirstByteOnLevel + tileIndexOnLevel;

        return {
            subtreeRootKey : subtreeRootKey,
            subtreeKey : subtreeKey,
            subtreeIndex : index
        };
    };

    /**
     * Finds the start level in the tree
     *
     * @private
     */
    Cesium3DTilesetImplicit.prototype.findSubtreeLevelStart = function(subtree) {
        var subtreeLevels = this._tilingScheme.subtreeLevels;
        // var isOct = this._isOct;
        var unpackedSize = this._unpackedSize;
        var unpackedArraySizes = this._unpackedArraySizes;

        var i;

        var firstIndex = 0;
        for (i = 0; i < unpackedSize; i++) {
            if (subtree[i] === 1) {
                firstIndex = i;
                break;
            }
        }

        for (i = 0; i < subtreeLevels; i++) {
            if (firstIndex < unpackedArraySizes[i+1]) {
                return i;
            }
        }

        return 0;
    };

    /**
     * Updates the _subtreeCache and _tiles maps from the subtreeArrayBuffer payload
     *
     * @private
     */
    Cesium3DTilesetImplicit.prototype.updateSubtreeCache = function(subtreeArrayBuffer, subtreeRootKey) {
        // Unpack subtreeArrayBuffer payload into a byte array
        var payload = new Uint8Array(subtreeArrayBuffer);
        // var subtreeLevels = this._tilingScheme.subtreeLevels;
        var isOct = this._isOct;
        var packedSize = this._packedSize;
        var unpackedSize = this._unpackedSize;
        var subtree = new Uint8Array(unpackedSize);

        var startIdx = isOct ? 1 : 2;
        var endIdx = packedSize - 1;
        var i, j;
        var idx = 0;
        subtree[idx++] = payload[0];
        if (!isOct) {
            for (i = 0; i < 4; i++) {
                subtree[idx++] = (payload[1] >> i) & 1;
            }
        }

        // iterate through payload update the arrays and then assign to the maps
        for(i = startIdx; i <= endIdx; i++) {
            for (j = 0; j < 8; j++) {
                subtree[idx++] = (payload[i] >> j) & 1;
            }
        }

        // Finally, assign to the map
        // var key = subtreeRootKey.w + '/' + subtreeRootKey.x + '/' + subtreeRootKey.y + '/' + subtreeRootKey.z;
        this._subtreeCache.set(subtree, subtreeRootKey);
    };

    Cesium3DTilesetImplicit.prototype.getGeomtricErrorBase = function() {
        return this._isOct ? 2 : 2;
    };

    /**
     * Updates the _subtreeCache arrays as well as updates the metadata view of
     * the tileset tree given a layerJson
     *
     * @private
     */
    Cesium3DTilesetImplicit.prototype.updateTilesetFromSubtree = function(resource, subtreeArrayBuffer, subtreeRootKey, parentTile) {
        if (!defined(subtreeArrayBuffer)) {
            throw new RuntimeError('DEBUG: Subtree ArrayBuffer is undefined.');
        }
        if (subtreeArrayBuffer.byteLength === 0) {
            throw new RuntimeError('DBUG: Subtree ArrayBuffer is empty?');
        }

        // console.log('ArrayBuffer length: ' + subtreeArrayBuffer.byteLength);

        var isOct = this._isOct;

        var key = subtreeRootKey.w + '/' + subtreeRootKey.x + '/' + subtreeRootKey.y + '/' + subtreeRootKey.z;

        var subtreeCache = this._subtreeCache;
        // if (subtreeCache.has(key)) {
        if (subtreeCache.has(subtreeRootKey, key)) {
            throw new RuntimeError('DEBUG: Subtree already exists?');
        }

        // Create an unpacked uint8array and an array and populate with 1/0;
        this.updateSubtreeCache(subtreeArrayBuffer, subtreeRootKey);

        // var subtree = subtreeCache.get(key);
        var subtreeInfo = subtreeCache.get(subtreeRootKey, key);
        var subtree = subtreeInfo._subtree;
        // console.log('subtree Uint8Array unpacked length: ' + subtree.length);
        // console.log('subtree key: ' + key);

        var statistics = this._statistics;
        var hasParent = defined(parentTile);

        // Maybe don't worry about the external tileset case quite yet
        // var boundingVolume = hasParent ? deriveImplicitBoundsFromParent(parentTile) : this._tilingScheme.boundingVolume;
        // var geometricError = hasParent ? parentTile._geometricError / 2 : this._geometricError;
        // var content = // TODO: put the { uri : "0/0/0" } or whatever the level/x/y is for the tile unless its the contentless root
        // TODO: for quad/oct lat/long spllitting, I think you must construct empty tiles all the way up to the
        // lvl 0 root(s) or until you get to a single tile. In either case still
        // generate a contentless root above that
        // on heads specified
        // TODO: if has parent need to properly create this
        var tilingScheme = this._tilingScheme;
        if (defined(tilingScheme.boundingVolume.region) && defined(tilingScheme.transform)) {
            // No transforms for region contexts
            tilingScheme.transform = Matrix4.clone(Matrix4.IDENTITY);
        }

        var rootInfo = {
            boundingVolume: tilingScheme.boundingVolume,
            geometricError: this._geometricError,
            content: undefined,
            refine: tilingScheme.refine,
            transform: tilingScheme.transform
        };

        var rootTile = hasParent ? parentTile : new Cesium3DTileImplicit(this, resource, rootInfo, undefined);
        // var rootTile = new Cesium3DTileImplicit(this, resource, rootInfo, parentTile);

        // If there is a parentTile, add the root of the currently loading tileset
        // to parentTile's children, and update its _depth.
        // if (hasParent) {
        //     parentTile.children.push(rootTile);
        //     rootTile._depth = parentTile._depth + 1;
        // } else {
        // }
        if (!hasParent) {
            var subtreeLevelStart = this.findSubtreeLevelStart(subtree);
            this._startLevel = subtreeRootKey.w + subtreeLevelStart;
            this.initLODDistances();
            // console.log('first level subtree: ' + subtreeLevelStart);
            // console.log('first level tree: ' + this._startLevel);
        }

        var level = this._startLevel;

        // TODO: merge with loop version but wait till the other todo's are ironed out

        // main layer.json, construct child tiles of contentless root
        var tilesetRoot = defined(this._root) ? this._root : rootTile;

        // Init the tiles array
        var unpackedSize = this._unpackedSize;
        var tilesArray = subtreeInfo._tiles;
        // var tilesArray = [];
        // var i;
        // for (i = 0; i < unpackedSize; i++) {
        //     tilesArray.push(undefined);
        // }

        // just loop for 0..unpackedSize-1
        // get the treeKey and subtreeKey from subtreeIndex
        // if available, make a tile, put it in the subtree index location in tilesArray
        // do another loop where you create the children links
        // if there are multiple 'roots' down the subtree, need the tileset root children to be all of those so make sure to push tilesetroot
        // children if not hasParent and on subtree level start
        // For finding all heads in the root or finding the start tile in a subtree (if the tileset root doesn't start at the root of the subtree)

        var subtreeLevels = tilingScheme.subtreeLevels;
        var subtreeLevels0Indexed = subtreeLevels -  1;
        var treeKey, subtreeKey, subtreeIndex, result, hasSubtree, onLastSubtreeLevel, levelDiff, gerrorDenom;
        var x, y, z, uri, uriSubtree, tileInfo, tile;
        var tilesetStartLevel = this._startLevel;
        var twoBitModeHasExtSub = true;
        var tilesetLastLevel = tilingScheme.lastLevel;
        var oneBitMode = defined(tilesetLastLevel);
        var contentRootGeometricError = this._geometricErrorContentRoot;
        // var lastSubtreeLevelStartIndex = this._unpackedArraySizes[subtreeLevels0Indexed];
        var base = this.getGeomtricErrorBase();
        // This loop is just to create the tiles in the right spots in the _tiles array
        for (subtreeIndex = 0; subtreeIndex < unpackedSize; subtreeIndex++) {
            if (subtree[subtreeIndex] === 0) {
                continue;
            }

            if (subtreeIndex === 0 && hasParent) {
                tilesArray[subtreeIndex] = parentTile;
                continue;
            }

            ++statistics.numberOfTilesTotal;

            result = this.getSubtreeInfoFromSubtreeIndexAndRootKey(subtreeIndex, subtreeRootKey);
            treeKey = result.treeKey;
            level = treeKey.w;
            x = treeKey.x;
            y = treeKey.y;
            z = treeKey.z;

            // uri = isOct ? level + '/' + z + '/'+ x + '/' + y : level + '/' + x + '/' + y;
            uri = isOct ? level + '/' + x + '/'+ y + '/' + z : level + '/' + x + '/' + y;

            subtreeKey = result.subtreeKey;
            onLastSubtreeLevel = subtreeKey.w === subtreeLevels0Indexed;
            hasSubtree = onLastSubtreeLevel && ((oneBitMode && level !== tilesetLastLevel) || (!oneBitMode && twoBitModeHasExtSub));
            uriSubtree = hasSubtree ? this._availabilityFolder + uri : undefined;
            levelDiff = level - tilesetStartLevel;
            gerrorDenom = Math.pow(base, levelDiff);
            tileInfo = {
                boundingVolume: this.deriveImplicitBounds(tilesetRoot, x, y, z, level),
                // geometricError: this.derivedImplicitGeometricError(tile, x, y, z, xTiles, yTiles),
                // geometricError: tilesetRoot.geometricError / (1 << (level - tilesetStartLevel)),
                geometricError: contentRootGeometricError / gerrorDenom,
                content: {
                    uri: uri,
                    uriSubtree: uriSubtree
                },
                treeKey: treeKey,
                subtreeKey: subtreeKey,
                subtreeIndex: subtreeIndex,
                subtreeRootKey: subtreeRootKey,
                refine: tilingScheme.refine
            };

            tile = new Cesium3DTileImplicit(this, resource, tileInfo, undefined);
            tile._depth = level;
            tilesArray[subtreeIndex] = tile;
            // Update the tilesArray array
            if (level === tilesetStartLevel) {
                tilesetRoot.children.push(tile);
                tile.parent = tilesetRoot;
                // TODO: I guess for implict the tileset holds the transform?
                // otherwise need to update the tiles transorm after teh parent has been assigned in this way
                // make a setParent function
            }
        }

        // Update the parent <--> child links
        var childTile, i;
        var childrenLength = isOct ? 8 : 4;
        var childSubtreeIndices, childSubtreeIndex;
        for (subtreeIndex = 0; subtreeIndex < unpackedSize; subtreeIndex++) {
            if (subtree[subtreeIndex] !== 1) {
                continue;
            }

            tile = tilesArray[subtreeIndex];

            if (tile.childSubtreeRootKeys[0].w !== subtreeRootKey.w) {
                // These children belong to a different subtree
                continue;
            }

            childSubtreeIndices = tile.childSubtreeIndices;
            for (i = 0; i < childrenLength; i++) {
                childSubtreeIndex = childSubtreeIndices[i];
                if (subtree[childSubtreeIndex] === 0) {
                    continue;
                }

                childTile = tilesArray[childSubtreeIndex];
                childTile.parent = tile;
                tile.children.push(childTile);
            }

            if (this._cullWithChildrenBounds) {
                Cesium3DTileOptimizations.checkChildrenWithinParent(tile);
            }
        }

        // var tiles = this._tiles;
        // if (tiles.has(key)) {
        //     throw new RuntimeError('DEBUG: Subtree already exists?');
        // }

        // console.log(rootTile);
        // console.log();
        // console.log('tile0: ');
        // console.log(tilesArray[0]);

        // tiles.set(key, tilesArray);

        return rootTile;
    };

    /**
     * Loads the main tileset JSON file or a tileset JSON file referenced from a tile.
     *
     * @private
     */
    Cesium3DTilesetImplicit.prototype.loadTileset = function(resource, tilesetJson, parentTile) {
        var asset = tilesetJson.asset;
        if (!defined(asset)) {
            throw new RuntimeError('Tileset must have an asset property.');
        }
        if (asset.version !== '0.0' && asset.version !== '1.0') {
            throw new RuntimeError('The tileset must be 3D Tiles version 0.0 or 1.0.');
        }

        var statistics = this._statistics;

        var tilesetVersion = asset.tilesetVersion;
        if (defined(tilesetVersion)) {
            // Append the tileset version to the resource
            this._basePath += '?v=' + tilesetVersion;
            resource.setQueryParameters({ v: tilesetVersion });
        } else {
            delete resource.queryParameters.v;
        }

        // A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
        // Get the basePath relative to the external tileset.
        var rootTile = new Cesium3DTileImplicit(this, resource, tilesetJson.root, parentTile);

        // If there is a parentTile, add the root of the currently loading tileset
        // to parentTile's children, and update its _depth.
        if (defined(parentTile)) {
            parentTile.children.push(rootTile);
            rootTile._depth = parentTile._depth + 1;
        }

        var stack = [];
        stack.push(rootTile);

        while (stack.length > 0) {
            var tile = stack.pop();
            ++statistics.numberOfTilesTotal;
            this._allTilesAdditive = this._allTilesAdditive && (tile.refine === Cesium3DTileRefine.ADD);
            var children = tile._header.children;
            if (defined(children)) {
                var length = children.length;
                for (var i = 0; i < length; ++i) {
                    var childHeader = children[i];
                    var childTile = new Cesium3DTileImplicit(this, resource, childHeader, tile);
                    tile.children.push(childTile);
                    childTile._depth = tile._depth + 1;
                    stack.push(childTile);
                }
            }

            if (this._cullWithChildrenBounds) {
                Cesium3DTileOptimizations.checkChildrenWithinParent(tile);
            }
        }

        return rootTile;
    };

    var scratchPositionNormal = new Cartesian3();
    var scratchCartographic = new Cartographic();
    var scratchMatrix = new Matrix4();
    var scratchCenter = new Cartesian3();
    var scratchPosition = new Cartesian3();
    var scratchDirection = new Cartesian3();

    function updateDynamicScreenSpaceError(tileset, frameState) {
        var up;
        var direction;
        var height;
        var minimumHeight;
        var maximumHeight;

        var camera = frameState.camera;
        var root = tileset._root;
        var tileBoundingVolume = root.contentBoundingVolume;

        if (tileBoundingVolume instanceof TileBoundingRegion) {
            up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
            direction = camera.directionWC;
            height = camera.positionCartographic.height;
            minimumHeight = tileBoundingVolume.minimumHeight;
            maximumHeight = tileBoundingVolume.maximumHeight;
        } else {
            // Transform camera position and direction into the local coordinate system of the tileset
            var transformLocal = Matrix4.inverseTransformation(root.computedTransform, scratchMatrix);
            var ellipsoid = frameState.mapProjection.ellipsoid;
            var boundingVolume = tileBoundingVolume.boundingVolume;
            var centerLocal = Matrix4.multiplyByPoint(transformLocal, boundingVolume.center, scratchCenter);
            if (Cartesian3.magnitude(centerLocal) > ellipsoid.minimumRadius) {
                // The tileset is defined in WGS84. Approximate the minimum and maximum height.
                var centerCartographic = Cartographic.fromCartesian(centerLocal, ellipsoid, scratchCartographic);
                up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
                direction = camera.directionWC;
                height = camera.positionCartographic.height;
                minimumHeight = 0.0;
                maximumHeight = centerCartographic.height * 2.0;
            } else {
                // The tileset is defined in local coordinates (z-up)
                var positionLocal = Matrix4.multiplyByPoint(transformLocal, camera.positionWC, scratchPosition);
                up = Cartesian3.UNIT_Z;
                direction = Matrix4.multiplyByPointAsVector(transformLocal, camera.directionWC, scratchDirection);
                direction = Cartesian3.normalize(direction, direction);
                height = positionLocal.z;
                if (tileBoundingVolume instanceof TileOrientedBoundingBox) {
                    // Assuming z-up, the last component stores the half-height of the box
                    var boxHeight = root._header.boundingVolume.box[11];
                    minimumHeight = centerLocal.z - boxHeight;
                    maximumHeight = centerLocal.z + boxHeight;
                } else if (tileBoundingVolume instanceof TileBoundingSphere) {
                    var radius = boundingVolume.radius;
                    minimumHeight = centerLocal.z - radius;
                    maximumHeight = centerLocal.z + radius;
                }
            }
        }

        // The range where the density starts to lessen. Start at the quarter height of the tileset.
        var heightFalloff = tileset.dynamicScreenSpaceErrorHeightFalloff;
        var heightClose = minimumHeight + (maximumHeight - minimumHeight) * heightFalloff;
        var heightFar = maximumHeight;

        var t = CesiumMath.clamp((height - heightClose) / (heightFar - heightClose), 0.0, 1.0);

        // Increase density as the camera tilts towards the horizon
        var dot = Math.abs(Cartesian3.dot(direction, up));
        var horizonFactor = 1.0 - dot;

        // Weaken the horizon factor as the camera height increases, implying the camera is further away from the tileset.
        // The goal is to increase density for the "street view", not when viewing the tileset from a distance.
        horizonFactor = horizonFactor * (1.0 - t);

        var density = tileset.dynamicScreenSpaceErrorDensity;
        density *= horizonFactor;

        tileset._dynamicScreenSpaceErrorComputedDensity = density;
    }

    ///////////////////////////////////////////////////////////////////////////

    function requestContent(tileset, tile) {
        if (tile.hasEmptyContent) {
            return;
        }

        var statistics = tileset._statistics;
        var expired = tile.contentExpired;
        var requested = tile.requestContent();
        // TODO: uncommenting this will cause some content on level 1 (1 past root) to become undefined
        tile.requestSubtreeContent();
        // var requstedSubtree = tile.requestSubtreeContent();

        if (!requested) {
            ++statistics.numberOfAttemptedRequests;
            return;
        }

        if (expired) {
            if (tile.hasTilesetContent) {
                destroySubtree(tileset, tile);
            } else {
                statistics.decrementLoadCounts(tile.content);
                --statistics.numberOfTilesWithContentReady;
            }
        }

        ++statistics.numberOfPendingRequests;
        tileset._requestedTilesInFlight.push(tile);

        tile.contentReadyToProcessPromise.then(addToProcessingQueue(tileset, tile));
        tile.contentReadyPromise.then(handleTileSuccess(tileset, tile)).otherwise(handleTileFailure(tileset, tile));
    }

    function sortRequestByPriority(a, b) {
        return a._priority - b._priority;
    }

    /**
     * Perform any pass invariant tasks here. Called after the render pass.
     * @private
     */
    Cesium3DTilesetImplicit.prototype.postPassesUpdate = function(frameState) {
        if (!this.ready) {
            return;
        }

        cancelOutOfViewRequests(this, frameState);
        raiseLoadProgressEvent(this, frameState);
        this._cache.unloadTiles(this, unloadTile);
    };

    /**
     * Perform any pass invariant tasks here. Called before any passes are executed.
     * @private
     */
    Cesium3DTilesetImplicit.prototype.prePassesUpdate = function(frameState) {
        if (!this.ready) {
            return;
        }

        processTiles(this, frameState);

        // Update clipping planes
        var clippingPlanes = this._clippingPlanes;
        this._clippingPlanesOriginMatrixDirty = true;
        if (defined(clippingPlanes) && clippingPlanes.enabled) {
            clippingPlanes.update(frameState);
        }

        if (!defined(this._loadTimestamp)) {
            this._loadTimestamp = JulianDate.clone(frameState.time);
        }
        this._timeSinceLoad = Math.max(JulianDate.secondsDifference(frameState.time, this._loadTimestamp) * 1000, 0.0);

        this._skipLevelOfDetail = this.skipLevelOfDetail && !defined(this._classificationType) && !this._disableSkipLevelOfDetail && !this._allTilesAdditive;

        if (this.dynamicScreenSpaceError) {
            updateDynamicScreenSpaceError(this, frameState);
        }

        if (frameState.newFrame) {
            this._cache.reset();
        }
    };

    function cancelOutOfViewRequests(tileset, frameState) {
        var requestedTilesInFlight = tileset._requestedTilesInFlight;
        var removeCount = 0;
        var length = requestedTilesInFlight.length;
        for (var i = 0; i < length; ++i) {
            var tile = requestedTilesInFlight[i];

            // NOTE: This is framerate dependant so make sure the threshold check is small
            var outOfView = (frameState.frameNumber - tile._touchedFrame) >= 1;
            if (tile._contentState !== Cesium3DTileContentState.LOADING) {
                // No longer fetching from host, don't need to track it anymore. Gets marked as LOADING in Cesium3DTileImplicit::requestContent().
                ++removeCount;
                continue;
            } else if (outOfView) {
                // RequestScheduler will take care of cancelling it
                tile._request.cancel();
                ++removeCount;
                continue;
            }

            if (removeCount > 0) {
                requestedTilesInFlight[i - removeCount] = tile;
            }
        }

        requestedTilesInFlight.length -= removeCount;
    }

    function requestTiles(tileset, isAsync) {
        // Sort requests by priority before making any requests.
        // This makes it less likely that requests will be cancelled after being issued.
        var requestedTiles = tileset._requestedTiles;
        var length = requestedTiles.length;
        requestedTiles.sort(sortRequestByPriority);
        for (var i = 0; i < length; ++i) {
            requestContent(tileset, requestedTiles[i]);
        }
    }

    function addToProcessingQueue(tileset, tile) {
        return function() {
            tileset._processingQueue.push(tile);

            --tileset._statistics.numberOfPendingRequests;
            ++tileset._statistics.numberOfTilesProcessing;
        };
    }

    function handleTileFailure(tileset, tile) {
        return function(error) {
            if (tileset._processingQueue.indexOf(tile) >= 0) {
                // Failed during processing
                --tileset._statistics.numberOfTilesProcessing;
            } else {
                // Failed when making request
                --tileset._statistics.numberOfPendingRequests;
            }

            var url = tile._contentResource.url;
            var message = defined(error.message) ? error.message : error.toString();
            if (tileset.tileFailed.numberOfListeners > 0) {
                tileset.tileFailed.raiseEvent({
                    url : url,
                    message : message
                });
            } else {
                console.log('A 3D tile failed to load: ' + url);
                console.log('Error: ' + message);
            }
        };
    }

    function handleTileSuccess(tileset, tile) {
        return function() {
            --tileset._statistics.numberOfTilesProcessing;

            if (!tile.hasTilesetContent) {
                // RESEARCH_IDEA: ability to unload tiles (without content) for an
                // external tileset when all the tiles are unloaded.
                tileset._statistics.incrementLoadCounts(tile.content);
                ++tileset._statistics.numberOfTilesWithContentReady;
                ++tileset._statistics.numberOfLoadedTilesTotal;

                // Add to the tile cache. Previously expired tiles are already in the cache and won't get re-added.
                tileset._cache.add(tile);
            }

            tileset.tileLoad.raiseEvent(tile);
        };
    }

    function filterProcessingQueue(tileset) {
        var tiles = tileset._processingQueue;
        var length = tiles.length;

        var removeCount = 0;
        for (var i = 0; i < length; ++i) {
            var tile = tiles[i];
            if (tile._contentState !== Cesium3DTileContentState.PROCESSING) {
                ++removeCount;
                continue;
            }
            if (removeCount > 0) {
                tiles[i - removeCount] = tile;
            }
        }
        tiles.length -= removeCount;
    }

    function processTiles(tileset, frameState) {
        filterProcessingQueue(tileset);
        var tiles = tileset._processingQueue;
        var length = tiles.length;
        // Process tiles in the PROCESSING state so they will eventually move to the READY state.
        for (var i = 0; i < length; ++i) {
            tiles[i].process(tileset, frameState);
        }
    }

    ///////////////////////////////////////////////////////////////////////////

    var scratchCartesian = new Cartesian3();

    var stringOptions = {
        maximumFractionDigits : 3
    };

    function formatMemoryString(memorySizeInBytes) {
        var memoryInMegabytes = memorySizeInBytes / 1048576;
        if (memoryInMegabytes < 1.0) {
            return memoryInMegabytes.toLocaleString(undefined, stringOptions);
        }
        return Math.round(memoryInMegabytes).toLocaleString();
    }

    function computeTileLabelPosition(tile) {
        var boundingVolume = tile.boundingVolume.boundingVolume;
        var halfAxes = boundingVolume.halfAxes;
        var radius = boundingVolume.radius;

        var position = Cartesian3.clone(boundingVolume.center, scratchCartesian);
        if (defined(halfAxes)) {
            position.x += 0.75 * (halfAxes[0] + halfAxes[3] + halfAxes[6]);
            position.y += 0.75 * (halfAxes[1] + halfAxes[4] + halfAxes[7]);
            position.z += 0.75 * (halfAxes[2] + halfAxes[5] + halfAxes[8]);
        } else if (defined(radius)) {
            var normal = Cartesian3.normalize(boundingVolume.center, scratchCartesian);
            normal = Cartesian3.multiplyByScalar(normal, 0.75 * radius, scratchCartesian);
            position = Cartesian3.add(normal, boundingVolume.center, scratchCartesian);
        }
        return position;
    }

    function addTileDebugLabel(tile, tileset, position) {
        var labelString = '';
        var attributes = 0;

        if (tileset.debugShowGeometricError) {
            labelString += '\nGeometric error: ' + tile.geometricError;
            attributes++;
        }

        if (tileset.debugShowRenderingStatistics) {
            labelString += '\nCommands: ' + tile.commandsLength;
            attributes++;

            // Don't display number of points or triangles if 0.
            var numberOfPoints = tile.content.pointsLength;
            if (numberOfPoints > 0) {
                labelString += '\nPoints: ' + tile.content.pointsLength;
                attributes++;
            }

            var numberOfTriangles = tile.content.trianglesLength;
            if (numberOfTriangles > 0) {
                labelString += '\nTriangles: ' + tile.content.trianglesLength;
                attributes++;
            }

            labelString += '\nFeatures: ' + tile.content.featuresLength;
            attributes ++;
        }

        if (tileset.debugShowMemoryUsage) {
            labelString += '\nTexture Memory: ' + formatMemoryString(tile.content.texturesByteLength);
            labelString += '\nGeometry Memory: ' + formatMemoryString(tile.content.geometryByteLength);
            attributes += 2;
        }

        if (tileset.debugShowUrl) {
            labelString += '\nUrl: ' + tile._header.content.uri;
            attributes++;
        }

        var newLabel = {
            text : labelString.substring(1),
            position : position,
            font : (19-attributes) + 'px sans-serif',
            showBackground : true,
            disableDepthTestDistance : Number.POSITIVE_INFINITY
        };

        return tileset._tileDebugLabels.add(newLabel);
    }

    function updateTileDebugLabels(tileset, frameState) {
        var i;
        var tile;
        var selectedTiles = tileset._selectedTiles;
        var selectedLength = selectedTiles.length;
        var emptyTiles = tileset._emptyTiles;
        var emptyLength = emptyTiles.length;
        tileset._tileDebugLabels.removeAll();

        if (tileset.debugPickedTileLabelOnly) {
            if (defined(tileset.debugPickedTile)) {
                var position = (defined(tileset.debugPickPosition)) ? tileset.debugPickPosition : computeTileLabelPosition(tileset.debugPickedTile);
                var label = addTileDebugLabel(tileset.debugPickedTile, tileset, position);
                label.pixelOffset = new Cartesian2(15, -15); // Offset to avoid picking the label.
            }
        } else {
            for (i = 0; i < selectedLength; ++i) {
                tile = selectedTiles[i];
                addTileDebugLabel(tile, tileset, computeTileLabelPosition(tile));
            }
            for (i = 0; i < emptyLength; ++i) {
                tile = emptyTiles[i];
                if (tile.hasTilesetContent) {
                    addTileDebugLabel(tile, tileset, computeTileLabelPosition(tile));
                }
            }
        }
        tileset._tileDebugLabels.update(frameState);
    }

    function updateTiles(tileset, frameState, isRender) {
        tileset._styleEngine.applyStyle(tileset, frameState);

        var statistics = tileset._statistics;
        var commandList = frameState.commandList;
        var numberOfInitialCommands = commandList.length;
        var selectedTiles = tileset._selectedTiles;
        var selectedLength = selectedTiles.length;
        var emptyTiles = tileset._emptyTiles;
        var emptyLength = emptyTiles.length;
        var tileVisible = tileset.tileVisible;
        var i;
        var tile;

        var bivariateVisibilityTest = tileset._skipLevelOfDetail && tileset._hasMixedContent && frameState.context.stencilBuffer && selectedLength > 0;

        tileset._backfaceCommands.length = 0;

        if (bivariateVisibilityTest) {
            if (!defined(tileset._stencilClearCommand)) {
                tileset._stencilClearCommand = new ClearCommand({
                    stencil : 0,
                    pass : Pass.CESIUM_3D_TILE,
                    renderState : RenderState.fromCache({
                        stencilMask : StencilConstants.SKIP_LOD_MASK
                    })
                });
            }
            commandList.push(tileset._stencilClearCommand);
        }

        var lengthBeforeUpdate = commandList.length;
        for (i = 0; i < selectedLength; ++i) {
            tile = selectedTiles[i];
            // Raise the tileVisible event before update in case the tileVisible event
            // handler makes changes that update needs to apply to WebGL resources
            if (isRender) {
                tileVisible.raiseEvent(tile);
            }
            tile.update(tileset, frameState);
            statistics.incrementSelectionCounts(tile.content);
            ++statistics.selected;
        }
        for (i = 0; i < emptyLength; ++i) {
            tile = emptyTiles[i];
            tile.update(tileset, frameState);
        }

        var addedCommandsLength = commandList.length - lengthBeforeUpdate;

        tileset._backfaceCommands.trim();

        if (bivariateVisibilityTest) {
            /**
             * Consider 'effective leaf' tiles as selected tiles that have no selected descendants. They may have children,
             * but they are currently our effective leaves because they do not have selected descendants. These tiles
             * are those where with tile._finalResolution === true.
             * Let 'unresolved' tiles be those with tile._finalResolution === false.
             *
             * 1. Render just the backfaces of unresolved tiles in order to lay down z
             * 2. Render all frontfaces wherever tile._selectionDepth > stencilBuffer.
             *    Replace stencilBuffer with tile._selectionDepth, when passing the z test.
             *    Because children are always drawn before ancestors {@link Cesium3DTilesetTraversalImplicit#traverseAndSelect},
             *    this effectively draws children first and does not draw ancestors if a descendant has already
             *    been drawn at that pixel.
             *    Step 1 prevents child tiles from appearing on top when they are truly behind ancestor content.
             *    If they are behind the backfaces of the ancestor, then they will not be drawn.
             *
             * NOTE: Step 2 sometimes causes visual artifacts when backfacing child content has some faces that
             * partially face the camera and are inside of the ancestor content. Because they are inside, they will
             * not be culled by the depth writes in Step 1, and because they partially face the camera, the stencil tests
             * will draw them on top of the ancestor content.
             *
             * NOTE: Because we always render backfaces of unresolved tiles, if the camera is looking at the backfaces
             * of an object, they will always be drawn while loading, even if backface culling is enabled.
             */

            var backfaceCommands = tileset._backfaceCommands.values;
            var backfaceCommandsLength = backfaceCommands.length;

            commandList.length += backfaceCommandsLength;

            // copy commands to the back of the commandList
            for (i = addedCommandsLength - 1; i >= 0; --i) {
                commandList[lengthBeforeUpdate + backfaceCommandsLength + i] = commandList[lengthBeforeUpdate + i];
            }

            // move backface commands to the front of the commandList
            for (i = 0; i < backfaceCommandsLength; ++i) {
                commandList[lengthBeforeUpdate + i] = backfaceCommands[i];
            }
        }

        // Number of commands added by each update above
        addedCommandsLength = commandList.length - numberOfInitialCommands;
        statistics.numberOfCommands = addedCommandsLength;

        // Only run EDL if simple attenuation is on
        if (isRender &&
            tileset.pointCloudShading.attenuation &&
            tileset.pointCloudShading.eyeDomeLighting &&
            (addedCommandsLength > 0)) {
            tileset._pointCloudEyeDomeLighting.update(frameState, numberOfInitialCommands, tileset.pointCloudShading);
        }

        if (isRender) {
            if (tileset.debugShowGeometricError || tileset.debugShowRenderingStatistics || tileset.debugShowMemoryUsage || tileset.debugShowUrl) {
                if (!defined(tileset._tileDebugLabels)) {
                    tileset._tileDebugLabels = new LabelCollection();
                }
                updateTileDebugLabels(tileset, frameState);
            } else {
                tileset._tileDebugLabels = tileset._tileDebugLabels && tileset._tileDebugLabels.destroy();
            }
        }
    }

    var scratchStack = [];

    function destroySubtree(tileset, tile) {
        var root = tile;
        var stack = scratchStack;
        stack.push(tile);
        while (stack.length > 0) {
            tile = stack.pop();
            var children = tile.children;
            var length = children.length;
            for (var i = 0; i < length; ++i) {
                stack.push(children[i]);
            }
            if (tile !== root) {
                destroyTile(tileset, tile);
                --tileset._statistics.numberOfTilesTotal;
            }
        }
        root.children = [];
    }

    function unloadTile(tileset, tile) {
        tileset.tileUnload.raiseEvent(tile);
        tileset._statistics.decrementLoadCounts(tile.content);
        --tileset._statistics.numberOfTilesWithContentReady;
        tile.unloadContent();
    }

    function destroyTile(tileset, tile) {
        tileset._cache.unloadTile(tileset, tile, unloadTile);
        tile.destroy();
    }

    /**
     * Unloads all tiles that weren't selected the previous frame.  This can be used to
     * explicitly manage the tile cache and reduce the total number of tiles loaded below
     * {@link Cesium3DTilesetImplicit#maximumMemoryUsage}.
     * <p>
     * Tile unloads occur at the next frame to keep all the WebGL delete calls
     * within the render loop.
     * </p>
     */
    Cesium3DTilesetImplicit.prototype.trimLoadedTiles = function() {
        this._cache.trim();
    };

    ///////////////////////////////////////////////////////////////////////////

    function raiseLoadProgressEvent(tileset, frameState) {
        var statistics = tileset._statistics;
        var statisticsLast = tileset._statisticsLast;

        var numberOfPendingRequests = statistics.numberOfPendingRequests;
        var numberOfTilesProcessing = statistics.numberOfTilesProcessing;
        var lastNumberOfPendingRequest = statisticsLast.numberOfPendingRequests;
        var lastNumberOfTilesProcessing = statisticsLast.numberOfTilesProcessing;

        Cesium3DTilesetStatistics.clone(statistics, statisticsLast);

        var progressChanged = (numberOfPendingRequests !== lastNumberOfPendingRequest) || (numberOfTilesProcessing !== lastNumberOfTilesProcessing);

        if (progressChanged) {
            frameState.afterRender.push(function() {
                tileset.loadProgress.raiseEvent(numberOfPendingRequests, numberOfTilesProcessing);
            });
        }

        tileset._tilesLoaded = (statistics.numberOfPendingRequests === 0) && (statistics.numberOfTilesProcessing === 0) && (statistics.numberOfAttemptedRequests === 0);

        // Events are raised (added to the afterRender queue) here since promises
        // may resolve outside of the update loop that then raise events, e.g.,
        // model's readyPromise.
        if (progressChanged && tileset._tilesLoaded) {
            frameState.afterRender.push(function() {
                tileset.allTilesLoaded.raiseEvent();
            });
            if (!tileset._initialTilesLoaded) {
                tileset._initialTilesLoaded = true;
                frameState.afterRender.push(function() {
                    tileset.initialTilesLoaded.raiseEvent();
                });
            }
        }
    }

    function resetMinimumMaximum(tileset) {
        tileset._heatmap.resetMinimumMaximum();
        // tileset._minimumPriority.depth = Number.MAX_VALUE;
        // tileset._maximumPriority.depth = -Number.MAX_VALUE;
        // tileset._minimumPriority.foveatedFactor = Number.MAX_VALUE;
        // tileset._maximumPriority.foveatedFactor = -Number.MAX_VALUE;
        // tileset._minimumPriority.distance = Number.MAX_VALUE;
        // tileset._maximumPriority.distance = -Number.MAX_VALUE;
        // tileset._minimumPriority.reverseScreenSpaceError = Number.MAX_VALUE;
        // tileset._maximumPriority.reverseScreenSpaceError = -Number.MAX_VALUE;
    }

    ///////////////////////////////////////////////////////////////////////////

    function update(tileset, frameState, passStatistics, passOptions) {
        if (frameState.mode === SceneMode.MORPHING) {
            return false;
        }

        if (!tileset.ready) {
            return false;
        }

        var statistics = tileset._statistics;
        statistics.clear();

        var isRender = passOptions.isRender;

        // Resets the visibility check for each pass
        ++tileset._updatedVisibilityFrame;

        // Update any tracked min max values
        resetMinimumMaximum(tileset);

        var traversal = tileset._traversals[passOptions.traversal];
        var ready = traversal.selectTiles(tileset, frameState);

        if (passOptions.requestTiles) {
            requestTiles(tileset);
        }

        updateTiles(tileset, frameState, isRender);

        // Update pass statistics
        Cesium3DTilesetStatistics.clone(statistics, passStatistics);

        if (isRender) {
            var credits = tileset._credits;
            if (defined(credits) && statistics.selected !== 0) {
                var length = credits.length;
                for (var i = 0; i < length; ++i) {
                    frameState.creditDisplay.addCredit(credits[i]);
                }
            }
        }

        return ready;
    }

    /**
     * @private
     */
    Cesium3DTilesetImplicit.prototype.update = function(frameState) {
        this.updateForPass(frameState, frameState.tilesetPassState);
    };

    /**
     * @private
     */
    Cesium3DTilesetImplicit.prototype.updateForPass = function(frameState, tilesetPassState) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.object('frameState', frameState);
        Check.typeOf.object('tilesetPassState', tilesetPassState);
        //>>includeEnd('debug');

        var pass = tilesetPassState.pass;
        if ((pass === Cesium3DTilePass.PRELOAD && (!this.preloadWhenHidden || this.show)) ||
            (pass === Cesium3DTilePass.PRELOAD_FLIGHT && (!this.preloadFlightDestinations || (!this.show && !this.preloadWhenHidden))) ||
            (pass === Cesium3DTilePass.REQUEST_RENDER_MODE_DEFER_CHECK && !this.cullRequestsWhileMoving && this.foveatedTimeDelay <= 0)) {
            return;
        }

        var originalCommandList = frameState.commandList;
        var originalCamera = frameState.camera;
        var originalCullingVolume = frameState.cullingVolume;

        tilesetPassState.ready = false;

        var passOptions = Cesium3DTilePass.getPassOptions(pass);
        var ignoreCommands = passOptions.ignoreCommands;

        var commandList = defaultValue(tilesetPassState.commandList, originalCommandList);
        var commandStart = commandList.length;

        frameState.commandList = commandList;
        frameState.camera = defaultValue(tilesetPassState.camera, originalCamera);
        frameState.cullingVolume = defaultValue(tilesetPassState.cullingVolume, originalCullingVolume);

        var passStatistics = this._statisticsPerPass[pass];

        if (this.show || ignoreCommands) {
            this._pass = pass;
            tilesetPassState.ready = update(this, frameState, passStatistics, passOptions);
        }

        if (ignoreCommands) {
            commandList.length = commandStart;
        }

        frameState.commandList = originalCommandList;
        frameState.camera = originalCamera;
        frameState.cullingVolume = originalCullingVolume;
    };

    /**
     * <code>true</code> if the tileset JSON file lists the extension in extensionsUsed; otherwise, <code>false</code>.
     * @param {String} extensionName The name of the extension to check.
     *
     * @returns {Boolean} <code>true</code> if the tileset JSON file lists the extension in extensionsUsed; otherwise, <code>false</code>.
     */
    Cesium3DTilesetImplicit.prototype.hasExtension = function(extensionName) {
        if (!defined(this._extensionsUsed)) {
            return false;
        }

        return (this._extensionsUsed.indexOf(extensionName) > -1);
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <br /><br />
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @returns {Boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
     *
     * @see Cesium3DTilesetImplicit#destroy
     */
    Cesium3DTilesetImplicit.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
     * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
     * <br /><br />
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
     * assign the return value (<code>undefined</code>) to the object as done in the example.
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @example
     * tileset = tileset && tileset.destroy();
     *
     * @see Cesium3DTilesetImplicit#isDestroyed
     */
    Cesium3DTilesetImplicit.prototype.destroy = function() {
        this._tileDebugLabels = this._tileDebugLabels && this._tileDebugLabels.destroy();
        this._clippingPlanes = this._clippingPlanes && this._clippingPlanes.destroy();

        // Traverse the tree and destroy all tiles
        if (defined(this._root)) {
            var stack = scratchStack;
            stack.push(this._root);

            while (stack.length > 0) {
                var tile = stack.pop();
                tile.destroy();

                var children = tile.children;
                var length = children.length;
                for (var i = 0; i < length; ++i) {
                    stack.push(children[i]);
                }
            }
        }

        this._root = undefined;
        return destroyObject(this);
    };

    /**
     * Optimization option. Used as a callback when {@link Cesium3DTilesetImplicit#foveatedScreenSpaceError} is true to control how much to raise the screen space error for tiles outside the foveated cone,
     * interpolating between {@link Cesium3DTilesetImplicit#foveatedMinimumScreenSpaceErrorRelaxation} and {@link Cesium3DTilesetImplicit#maximumScreenSpaceError}.
     *
     * @callback Cesium3DTilesetImplicit~foveatedInterpolationCallback
     * @default Math.lerp
     *
     * @param {Number} p The start value to interpolate.
     * @param {Number} q The end value to interpolate.
     * @param {Number} time The time of interpolation generally in the range <code>[0.0, 1.0]</code>.
     * @returns {Number} The interpolated value.
     */

    return Cesium3DTilesetImplicit;
});