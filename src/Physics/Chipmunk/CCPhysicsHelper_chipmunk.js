/****************************************************************************
 Copyright (c) 2015 Young-Hwan Mun (yh.msw9@gmail.com)
 Copyright (c) 2013 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

if ( cc.sys.isNative )
{
	var loopIndexes = cp.loopIndexes = function(verts)
	{
		var start = 0, end = 0;
		var minx, miny, maxx, maxy;
		minx = maxx = verts[0];
		miny = maxy = verts[1];
	
		var count = verts.length >> 1;
		for(var i=1; i<count; i++){
			var x = verts[i*2];
			var y = verts[i*2 + 1];
	
			if(x < minx || (x == minx && y < miny)){
				minx = x;
				miny = y;
				start = i;
			} else if(x > maxx || (x == maxx && y > maxy)){
				maxx = x;
				maxy = y;
				end = i;
			}
		}
		return [start, end];
	};
	
	var SWAP = function(arr, idx1, idx2)
	{
		var tmp = arr[idx1*2];
		arr[idx1*2] = arr[idx2*2];
		arr[idx2*2] = tmp;
	
		tmp = arr[idx1*2+1];
		arr[idx1*2+1] = arr[idx2*2+1];
		arr[idx2*2+1] = tmp;
	};
	
	var QHullPartition = function(verts, offs, count, a, b, tol)
	{
		if(count === 0) return 0;
	
		var max = 0;
		var pivot = offs;
	
		var delta = cp.v.sub(b, a);
		var valueTol = tol * cp.v.len(delta);
	
		var head = offs;
		for(var tail = offs+count-1; head <= tail;){
			var v = new cp.v(verts[head * 2], verts[head * 2 + 1]);
			var value = cp.v.cross(delta, cp.v.sub(v, a));
			if(value > valueTol){
				if(value > max){
					max = value;
					pivot = head;
				}
	
				head++;
			} else {
				SWAP(verts, head, tail);
				tail--;
			}
		}
	
		// move the new pivot to the front if it's not already there.
		if(pivot != offs) SWAP(verts, offs, pivot);
		return head - offs;
	};
	
	var QHullReduce = function(tol, verts, offs, count, a, pivot, b, resultPos)
	{
		if(count < 0){
			return 0;
		} else if(count == 0) {
			verts[resultPos*2] = pivot.x;
			verts[resultPos*2+1] = pivot.y;
			return 1;
		} else {
			var left_count = QHullPartition(verts, offs, count, a, pivot, tol);
			var left = new cp.v(verts[offs*2], verts[offs*2+1]);
			var index = QHullReduce(tol, verts, offs + 1, left_count - 1, a, left, pivot, resultPos);
	
			var pivotPos = resultPos + index++;
			verts[pivotPos*2] = pivot.x;
			verts[pivotPos*2+1] = pivot.y;
	
			var right_count = QHullPartition(verts, offs + left_count, count - left_count, pivot, b, tol);
			var right = new cp.v(verts[(offs+left_count)*2], verts[(offs+left_count)*2+1]);
			return index + QHullReduce(tol, verts, offs + left_count + 1, right_count - 1, pivot, right, b, resultPos + index);
		}
	};
	
	//QuickHull seemed like a neat algorithm, and efficient-ish for large input sets.
	//My implementation performs an in place reduction using the result array as scratch space.
	
	//Pass an Array into result to put the result of the calculation there. Otherwise, pass null
	//and the verts list will be edited in-place.
	
	//Expects the verts to be described in the same way as cpPolyShape - which is to say, it should
	//be a list of [x1,y1,x2,y2,x3,y3,...].
	
	//tolerance is in world coordinates. Eg, 2.
	cp.convexHull = function(verts, result, tolerance)
	{
		if(result){
			// Copy the line vertexes into the empty part of the result polyline to use as a scratch buffer.
			for (var i = 0; i < verts.length; i++){
				result[i] = verts[i];
			}
		} else {
			// If a result array was not specified, reduce the input instead.
			result = verts;
		}
	
		// Degenerate case, all points are the same.
		var indexes = loopIndexes(verts);
		var start = indexes[0], end = indexes[1];
		if(start == end){
			//if(first) (*first) = 0;
			result.length = 2;
			return result;
		}
	
		SWAP(result, 0, start);
		SWAP(result, 1, end == 0 ? start : end);
	
		var a = new cp.v (result[0], result[1]);
		var b = new cp.v (result[2], result[3]);
	
		var count = verts.length >> 1;
		//if(first) (*first) = start;
		var resultCount = QHullReduce(tolerance, result, 2, count - 2, a, b, a, 1) + 1;
		result.length = resultCount*2;
	
		return result;
	};
}
