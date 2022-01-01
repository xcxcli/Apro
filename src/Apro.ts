const Apro=(()=>{//let toString=Object.prototype.toString;
let isFunction=(obj:any):boolean=>typeof obj==="function";//toString.call(obj)==="[object Function]"
let isObjOrFunc=(obj:any):boolean=>obj!==null&&(typeof obj==="object"||typeof obj==="function");

type State="pending"|"fulfilled"|"rejected";
interface resFunc{
	(value?:any):any
};
interface Callback{
	resolve:resFunc
	reject:resFunc
	onFullfilled:any
	onRejected:any
};

class Apro{
	callbacks:Callback[]=[]
	state:State="pending"
	value:any
	constructor(func:Function){
		if(!isFunction(func))throw new TypeError("func should be a function");
		try{
			func(this._resolve.bind(this),this._reject.bind(this));
		}catch(e){this._reject(e);}
	}
	then(onFullfilled?:any,onRejected?:any){
		return new Apro((resolve:resFunc,reject:resFunc)=>{
			this._call({
				resolve,reject,onFullfilled,onRejected
			});
		});
	}
	catch(onError?:any){
		return this.then(null,onError);
	}
	finally(onDone?:any){
		return this.then(onDone,onDone);
	}
	_call(callback:Callback){
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
			let ret:any,cb=callback.resolve;
			try{ret=func(this.value);}
			catch(e){
				ret=e;
				this.state="rejected";
				cb=callback.reject;
			}
			cb(ret);
		},5);
	}
	level:number=0
	_resolve(value:any,vlevel:number=0){
		if(this.state!=="pending"||this.level!==vlevel)return;
		if(value===this){
			this._reject(new TypeError("chaining promise detected"));
			return;
		}
		let level:number=++this.level;
		if(isObjOrFunc(value)){
			try{
				let then:any=value.then;
				if(isFunction(then)){
					then.call(value,
						(v:any)=>{this._resolve(v,level);},
						(e:any)=>{this._reject(e,level);}
					);
					return;
				}
			}catch(e){this._reject(e,level);return;}
		}
		this.state="fulfilled";
		this.value=value;
		this.callbacks.forEach(callback=>this._call(callback));
	}
	_reject(error:any,vlevel:number=0){
		if(this.state!=="pending"||this.level!==vlevel)return;
		this.state="rejected";
		this.value=error;
		this.callbacks.forEach(callback=>this._call(callback));
	}
	static resolve(value:any){
		if(value instanceof Apro)return value;
		return Apro.resolved.then(()=>{
			return value;
		});
	}
	static reject(error:any){
		return Apro.resolved.then(()=>{
			throw error;
		});
	}
	static all(promises:any[]){
		return new Apro((resolve:resFunc,reject:resFunc)=>{
			let len:number=promises.length,rets:any[]=[];
			promises.forEach((promise,index)=>Apro.resolve(promise).then(
				(value:any)=>{
					rets[index]=value;
					if(!--len)resolve(rets);
				},
				(error:any)=>reject(error)
			));
		});
	}
	static allSettled(promises:any[]){
		return new Apro((resolve:resFunc)=>{
			let len:number=promises.length,rets:any[]=[];
			promises.forEach((promise,index)=>Apro.resolve(promise).finally(
				(value:any)=>{
					rets[index]=value;
					if(!--len)resolve(rets);
				}
			));
		});
	}
	static race(promises:any[]){
		return new Apro((resolve:resFunc,reject:resFunc)=>{
			promises.forEach((promise)=>Apro.resolve(promise).then(
				(value:any)=>resolve(value),
				(error:any)=>reject(error)
			));
		});
	}
	static resolved=new Apro((res:resFunc)=>res())
};//todo any
return Apro;
})();
