Array.prototype.asyncEach = function (iterator) {
	var list = this,
		n = list.length,
		i = -1,
		calls = 0,
		looping = false;

	var iterate = function () {
		calls -= 1;
		i += 1;
		if (i === n) return;
		iterator(list[i], resume);
	};

	var loop = function () {
		if (looping) return;
		looping = true;
		while (calls > 0) iterate();
		looping = false;
	};

	var resume = function () {
		calls += 1;
		if (typeof setTimeout === 'undefined') loop();
		else setTimeout(iterate, 1);
	};
	resume();
};