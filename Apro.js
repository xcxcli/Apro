let toString=Object.prototype.toString;
let isFunction=obj=>typeof obj==="function";//toString.call(obj)==="[object Function]"
let isThenable=obj=>(typeof obj==="function"||typeof obj==="object")&&obj!==null&&typeof obj.then==="function";

let tryThenable=(promise,obj,cb)=>{
	let waitID=++promise.waitID;
	if(obj===null||(typeof obj!=="object"&&typeof obj!=="function"))return false;
	try{
		let then=obj.then;
		if(typeof then!=="function")return false;
		cb(then,waitID);
	}
	catch(e){promise._reject(e,waitID);}
	return true;
};
class Apro{
	callbacks=[]
	state="pending"
	value
	constructor(func){
		func(this._resolve.bind(this),this._reject.bind(this));
	}
	then(onFullfilled,onRejected){
		return new Apro((resolve,reject)=>{
			this._handle({
				resolve,reject,onFullfilled,onRejected
			});
		});
	}
	catch(onError){
		return this.then(null,onError);
	}
	finally(onDone){//?
		return this.then(onDone,onDone);
	}
	_handle(callback){
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
			catch(error){
				ret=error;
				this.state="rejected";
				cb=callback.reject;
			}
			cb(ret);
		});
	}
	waitID=0
	_resolve(value,ID=0){
		if(this.state!=="pending"||this.waitID!==ID)return;
		if(value===this){
			this._reject(new TypeError("Cyclic Promise"));
			return;
		}
		if(tryThenable(this,value,(then,waitID)=>{
			then.call(value,v=>{
				this._resolve(v,waitID);
			},v=>{
				this._reject(v,waitID);
			})
		}))return;
		this.state="fulfilled";
		this.value=value;
		this.callbacks.forEach(callback=>this._handle(callback));
	}
	_reject(error,ID=0){
		if(this.state!=="pending"||this.waitID!==ID)return;
		this.state="rejected";
		this.value=error;
		//console.log("REJECTED");
		this.callbacks.forEach(callback=>this._handle(callback));
	}
	static resolve(value){
		if(value instanceof Apro)return value;
		// if(tryThenable())
		if(isThenable(value))return new Apro((resolve,reject)=>value.then(resolve));
		return new Apro((resolve,reject)=>resolve(value));
	}
	static reject(value){
		if(value instanceof Apro)return value;
		if(isThenable(value))return new Apro((resolve,reject)=>value.then(reject));
		return new Apro((resolve,reject)=>reject(value));
	}
	static deferred(){
		let ret={};
		ret.promise=new Apro((res,rej)=>{
			ret.resolve=res;ret.reject=rej;
		});
		return ret;
	}
	static all(promises){
		return new Apro((resolve,reject)=>{
			let len=promises.length,rets=[];
			promises.forEach((promise,index)=>Apro.resolve(promise).then(
				value=>{
					rets[index]=value;
					if(!--len)resolve(rets);
				},
				error=>reject(error)
			));
		});
	}
	static race(promises){
		return new Apro((resolve,reject)=>{
			promises.forEach((promise,index)=>Apro.resolve(promise).then(
				value=>resolve(value),
				error=>reject(error)
			));
		});
	}
};

module.exports=Apro;
