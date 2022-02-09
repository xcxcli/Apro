declare module "Apro"{
	type ResType<S>=S|Apro<ResType<S>,any>|PromiseLike<ResType<S>,any>;
	interface resFunc<S>{
		(s:S):void
	}
	interface onFunc<S,A>{
		(s:S):ResType<A>
	}
	interface constructFunc<S,T>{
		(resolve:resFunc<S>,reject:resFunc<T>):void
	}
	
	interface Thenable<S,T>{
		<A,B>(onFulfilled:onFunc<S,A>,onRejected:onFunc<T,B>):PromiseLike<A,B>
	}
	interface PromiseLike<S,T>{
		then:Thenable<S,T>
	}

	export default class Apro<S,T>{
		static resolved:Apro<undefined,undefined>
		constructor(Function:constructFunc<S,T>)

		then<A,B>(onFulfilled:onFunc<S,A>,onRejected:onFunc<T,B>):Apro<A,B>
		then<A>(onFulfilled:onFunc<S,A>,onRejected:null):Apro<A,T>
		then<B>(onFulfilled:null,onRejected:onFunc<T,B>):Apro<S,B>
		catch<B>(onError:onFunc<T,B>):Apro<S,B>
		finally<A>(onDone:onFunc<S|T,A>):Apro<A,A>

		static resolve<S>(s:ResType<S>):Apro<S,any>
		static reject<T>(t:ResType<T>):Apro<any,T>

		static all<A,B>(apros:Apro<A,B>[]):Apro<A[],B>
		static all<A>(apros:Apro<A,any>[]):Apro<A[],any>
		static all<B>(apros:Apro<any,B>[]):Apro<any[],B>
		static all(apros:Apro<any,any>[]):Apro<any[],any>
		
		static allSettled<A>(apros:Apro<A,A>[]):Apro<A[],never>
		static allSettled(apros:Apro<any,any>[]):Apro<any[],never>

		static race<A,B>(apros:Apro<A,B>[]):Apro<A,B>
		static race<A>(apros:Apro<A,any>[]):Apro<A,any>
		static race<B>(apros:Apro<any,B>[]):Apro<any,B>
		static race(apros:Apro<any,any>[]):Apro<any,any>
	}
}