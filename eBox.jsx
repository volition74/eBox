{
    // Creating layer and property mocks
    createBox({ size = [100, 100], position = [0, 0], rounding = [0, 0, 0, 0], anchor = 'center', isClosed = true, 
    // From https://spencermortensen.com/articles/bezier-circle/
    tangentMult = 0.55, }) {
        const tempPoints = sizeToPoints(size);
        const centerPosition = anchorPositionToCenterPosition(position, size, anchor);
        const centeredPoints = movePoints(tempPoints, [0, 0], centerPosition);
        const compPositionPoints = pointsToComp(centeredPoints);
        let boxPoints = compPositionPoints;
        function scaleBoxPoints(scale, anchor) {
            // Remap scale to [0..1]
            const normalizedScale = scale.map((scale) => scale / 100);
            const [pTl, pTr, pBr, pBl] = boxPoints;
            const boxWidth = pTr[0] - pTl[0];
            const boxHeight = pBr[1] - pTl[1];
            const boxCenter = thisLayer.add(pTl, [boxWidth / 2, boxHeight / 2]);
            // Get offsets from center for each point
            const deltasFromCenter = boxPoints.map((point) => thisLayer.sub(point, boxCenter));
            boxPoints = getScaledDeltas().map((delta) => thisLayer.add(boxCenter, delta));
            function getScaledDeltas() {
                const [dTl, dTr, dBr, dBl] = deltasFromCenter;
                const [sx, sy] = normalizedScale;
                /**
                 * Used to multiply a delta so it scales not to zero,
                 * but to -1, for scaling from corner anchors
                 */
                const doubleMult = (val, mul) => val * (2 * mul - 1);
                if (anchor === 'topLeft') {
                    const sTl = dTl;
                    const sTr = [doubleMult(dTr[0], sx), dTr[1]];
                    const sBr = [doubleMult(dBr[0], sx), doubleMult(dBr[1], sy)];
                    const sBl = [dBl[0], doubleMult(dBl[1], sy)];
                    return [sTl, sTr, sBr, sBl];
                }
                if (anchor === 'topRight') {
                    const sTl = [doubleMult(dTl[0], sx), dTl[1]];
                    const sTr = dTr;
                    const sBr = [dBr[0], doubleMult(dBr[1], sy)];
                    const sBl = [doubleMult(dBl[0], sx), doubleMult(dBl[1], sy)];
                    return [sTl, sTr, sBr, sBl];
                }
                if (anchor === 'topCenter') {
                    const sTl = [dTl[0] * sx, dTl[1]];
                    const sTr = [dTr[0] * sx, dTr[1]];
                    const sBr = [dBr[0] * sx, doubleMult(dBr[1], sy)];
                    const sBl = [dBl[0] * sx, doubleMult(dBl[1], sy)];
                    return [sTl, sTr, sBr, sBl];
                }
                if (anchor === 'bottomRight') {
                    const sTl = [doubleMult(dTl[0], sx), doubleMult(dTl[1], sy)];
                    const sTr = [dTr[0], doubleMult(dTr[1], sy)];
                    const sBr = dBr;
                    const sBl = [doubleMult(dBl[0], sx), dBl[1]];
                    return [sTl, sTr, sBr, sBl];
                }
                if (anchor === 'bottomLeft') {
                    const sTl = [dTl[0], doubleMult(dTl[1], sy)];
                    const sTr = [doubleMult(dTr[0], sx), doubleMult(dTr[1], sy)];
                    const sBr = [doubleMult(dBr[0], sx), dBr[1]];
                    const sBl = dBl;
                    return [sTl, sTr, sBr, sBl];
                }
                if (anchor === 'bottomCenter') {
                    const sTl = [dTl[0] * sx, doubleMult(dTl[1], sy)];
                    const sTr = [dTr[0] * sx, doubleMult(dTr[1], sy)];
                    const sBr = [dBr[0] * sx, dBr[1]];
                    const sBl = [dBl[0] * sx, dBl[1]];
                    return [sTl, sTr, sBr, sBl];
                }
                if (anchor === 'centerLeft') {
                    const sTl = [dTl[0], dTl[1] * sy];
                    const sTr = [doubleMult(dTr[0], sx), dTr[1] * sy];
                    const sBr = [doubleMult(dBr[0], sx), dBr[1] * sy];
                    const sBl = [dBl[0], dBl[1] * sy];
                    return [sTl, sTr, sBr, sBl];
                }
                if (anchor === 'centerRight') {
                    const sTl = [doubleMult(dTl[0], sx), dTl[1] * sy];
                    const sTr = [dTr[0], dTr[1] * sy];
                    const sBr = [dBr[0], dBr[1] * sy];
                    const sBl = [doubleMult(dBl[0], sx), dBl[1] * sy];
                    return [sTl, sTr, sBr, sBl];
                }
                /**
                 * anchor === 'center'
                 * no doubling needed, just scale
                 * each delta
                 */
                return deltasFromCenter.map((delta) => {
                    return delta.map((dimension, index) => {
                        return dimension * normalizedScale[index];
                    });
                });
            }
        }
        function getRoundedPathForPoints(points) {
            const [pTl, pTr, pBr, pBl] = points;
            const width = pTr[0] - pTl[0];
            const height = pBl[1] - pTl[1];
            const [rTl, rTr, rBr, rBl] = rounding.map((radius) => {
                const minDimension = Math.min(width, height);
                return Math.max(Math.min(minDimension / 2, radius), 0);
            });
            const cornerPoints = [
                // Top left
                thisLayer.add(pTl, [0, rTl]),
                thisLayer.add(pTl, [rTl, 0]),
                // Top right
                thisLayer.add(pTr, [-rTr, 0]),
                thisLayer.add(pTr, [0, rTr]),
                // Bottom right
                thisLayer.add(pBr, [0, -rBr]),
                thisLayer.add(pBr, [-rBr, 0]),
                // Bottom left
                thisLayer.add(pBl, [rBl, 0]),
                thisLayer.add(pBl, [0, -rBl]),
            ];
            const inTangents = [
                // Top left
                [0, 0],
                [-rTl, 0],
                // Top right
                [0, 0],
                [0, -rTr],
                // Bottom right
                [0, 0],
                [rBr, 0],
                // Bottom left
                [0, 0],
                [0, rBl],
            ].map((p) => thisLayer.mul(p, tangentMult));
            const outTangents = [
                // Top left
                [0, -rTl],
                [0, 0],
                // Top right
                [rTr, 0],
                [0, 0],
                // Bottom right
                [0, rBr],
                [0, 0],
                // Bottom left
                [-rBl, 0],
                [0, 0],
            ].map((p) => thisLayer.mul(p, tangentMult));
            return thisProperty.createPath(cornerPoints, inTangents, outTangents, isClosed);
        }
        return {
            setScale: scaleBoxPoints,
            getPath: () => getRoundedPathForPoints(boxPoints),
        };
        function anchorPositionToCenterPosition(position, size, anchor) {
            const positionCalculations = {
                topLeft: () => [
                    position[0] + size[0] / 2,
                    position[1] + size[1] / 2,
                ],
                topCenter: () => [position[0], position[1] + size[1] / 2],
                topRight: () => [
                    position[0] - size[0] / 2,
                    position[1] + size[1] / 2,
                ],
                centerLeft: () => [position[0] + size[1] / 2, position[1]],
                center: () => position,
                centerRight: () => [position[0] - size[1] / 2, position[1]],
                bottomLeft: () => [
                    position[0] + size[0] / 2,
                    position[1] - size[1] / 2,
                ],
                bottomCenter: () => [position[0], position[1] - size[1] / 2],
                bottomRight: () => [
                    position[0] - size[0] / 2,
                    position[1] - size[1] / 2,
                ],
            };
            return positionCalculations[anchor]();
        }
        function sizeToPoints(size) {
            return [
                [-size[0] / 2, -size[1] / 2],
                [size[0] / 2, -size[1] / 2],
                [size[0] / 2, size[1] / 2],
                [-size[0] / 2, size[1] / 2],
            ];
        }
        function movePoints(points, oldPosition, newPosition) {
            const positionDelta = newPosition.map((dimension, dimensionIndex) => {
                return dimension - oldPosition[dimensionIndex];
            });
            return points.map((point) => {
                return point.map((dimension, dimensionIndex) => {
                    return dimension + positionDelta[dimensionIndex];
                });
            });
        }
        function pointsToComp(points) {
            return points.map((point) => thisLayer.fromComp(point));
        }
    },
    version: '2.0.0',
}