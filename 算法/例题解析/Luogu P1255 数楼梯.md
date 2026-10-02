# 题目内容

## 题目描述

楼梯有 $N$ 阶，上楼可以一步上一阶，也可以一步上二阶。

编一个程序，计算共有多少种不同的走法。

## 输入格式

一个数字，楼梯数。

## 输出格式

输出走的方式总数。

## 输入输出样例 #1

### 输入 #1

```
4
```

### 输出 #1

```
5
```

## 说明/提示

- 对于 $60\%$ 的数据，$N \leq 50$；   
- 对于 $100\%$ 的数据，$1 \le N \leq 5000$。


# 思路分析

用递推的思路进行分析：假设 $f(n)$ 是上n阶楼梯的方式数，则有关系式（$n>2$）
$$
f(n) = f(n-1) + f(n-2)
$$
而 $n=1$ 时，$f(n) = 1$ ；$n=2$ 时，$f(n) = 2$ ，

发现 $f(n)$ 即为斐波那契数列的第n+1项，计算斐波那契数列使用[[递归与动态规划# 递归的一般思路|递归]]。

而注意到 $1 \le N \leq 5000$ 的条件，题目可能需要[[高精度算法]]进行运算。

递归存在超时问题，因此使用[[递归与动态规划#动态规划|动态规划]]来降低运行时间。


# 题解

```cpp
#include <bits/stdc++.h>
using namespace std;

string add(string a,string b){
	stack<char> res;
	int c=0;
	int i=a.size()-1;
	int j=b.size()-1;//pointer
	
	while(i>=0||j>=0||c>0){
		int t=c;
		if(i>=0)t+=a[i--]-'0';
		if(j>=0)t+=b[j--]-'0';
		
		res.push((t%10)+'0');
		c=t/10;
	}
	
	string ans;
	while(!res.empty()){
		ans+=res.top();
		res.pop();
	}
	
	return ans;
}

string fib(string* dp,int n){
	if(dp[n]!="")return(dp[n]);
	else{
		if(n==1)return("1"); 
		if(n==2)return("2");
		string r = add(fib(dp,n-1),fib(dp,n-2));
		dp[n] = r;
		return r;
	}
}

int main(){
	int x;
	cin>>x;
	string* dp=new string[x+1]();
	cout << fib(dp,x);
	return 0;
}
```
