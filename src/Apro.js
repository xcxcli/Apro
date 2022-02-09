let isFunction=obj=>typeof obj==="function";
let isObjOrFunc=obj=>obj!==null&&(typeof obj==="object"||isFunction(obj));

class Apro{
	callbacks=[]
	state="pending"
	value
	constructor(func){
		if(!isFunction(func))throw new TypeError("func should be a function");
		try{
			func(this._resolve.bind(this),this._reject.bind(this));
		}catch(e){this._reject(e);}
	}
	then(onFullfilled,onRejected){
		return new Apro((resolve,reject)=>{
			this._call({
				resolve,reject,onFullfilled,onRejected
			});
		});
	}
	catch(onError){
		return this.then(null,onError);
	}
	finally(onDone){
		return this.then(onDone,onDone);
	}
	_call(callback){
		if(this.state==="pending"){
			this.callbacks.push(callback);
			return;
		}
		let isFulfilled=this.state==="fulfilled",
			func=isFulfilled?callback.onFullfilled:callback.onRejected;
		setTimeout(()=>{
			if(!isFunction(func)){
				callback[isFulfilled?"resolve":"reject"](this.value);
				return;
			}
			let ret,cb=callback.resolve;
			try{ret=func(this.value);}
			catch(e){
				ret=e;
				this.state="rejected";
				cb=callback.reject;
			}
			cb(ret);
		},5);
	}
	level=0
	_resolve(value,vlevel=0){
		if(this.state!=="pending"||this.level!==vlevel)return;
		if(value===this){
			this._reject(new TypeError("chaining promise detected"));
			return;
		}
		let level=++this.level;
		if(isObjOrFunc(value)){
			try{
				let then=value.then;
				if(isFunction(then)){
					then.call(value,
						v=>{this._resolve(v,level);},
						e=>{this._reject(e,level);}
					);
					return;
				}
			}catch(e){this._reject(e,level);return;}
		}
		this.state="fulfilled";
		this.value=value;
		this.callbacks.forEach(callback=>this._call(callback));
	}
	_reject(error,vlevel=0){
		if(this.state!=="pending"||this.level!==vlevel)return;
		this.state="rejected";
		this.value=error;
		this.callbacks.forEach(callback=>this._call(callback));
	}
	static resolved=new Apro(res=>res());
	static resolve(value){
		if(value instanceof Apro)return value;
		return Apro.resolved.then(()=>{
			return value;
		});
	}
	static reject(error){
		return Apro.resolved.then(()=>{
			throw error;
		});
	}
	static deferred(){
		let ret={};
		ret.promise=new Apro((res,rej)=>{
			ret.resolve=res;ret.reject=rej;
		});
		return ret;
	}
	static all(apros){
		return new Apro((resolve,reject)=>{
			let len=apros.length,rets=[];
			apros.forEach((apro,index)=>Apro.resolve(apro).then(
				value=>{
					rets[index]=value;
					if(!--len)resolve(rets);
				},
				error=>reject(error)
			));
		});
	}
	static allSettled(apros){
		return new Apro((resolve,reject)=>{
			let len=apros.length,rets=[];
			apros.forEach((apro,index)=>Apro.resolve(apro).finally(
				value=>{
					rets[index]=value;
					if(!--len)resolve(rets);
				}
			));
		});
	}
	static race(apros){
		return new Apro((resolve,reject)=>{
			apros.forEach((apro,index)=>Apro.resolve(apro).then(
				value=>resolve(value),
				error=>reject(error)
			));
		});
	}
};//todo any

module.exports=Apro;
