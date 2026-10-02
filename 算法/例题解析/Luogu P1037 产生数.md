# 题目内容

## 题目描述

给出一个整数 $n$ 和 $k$ 个变换规则。

规则：
- 一位数可变换成另一个一位数。
- 规则的右部不能为零。

例如：$n=234,k=2$。有以下两个规则：

- $2\longrightarrow 5$。  
- $3\longrightarrow 6$。 

上面的整数 $234$ 经过变换后可能产生出的整数为（包括原数）:

- $234$。
- $534$。
- $264$。
- $564$。

共 $4$ 种不同的产生数。

现在给出一个整数 $n$ 和 $k$ 个规则。求出经过任意次的变换（$0$ 次或多次），能产生出多少个不同整数。

仅要求输出个数。

## 输入格式

第一行两个整数 $n,k$，含义如题面所示。

接下来 $k$ 行，每行两个整数 $x_i,y_i$，表示每条规则。

## 输出格式

共一行，输出能生成的数字个数。

## 输入输出样例 #1

### 输入 #1

```
234 2
2 5
3 6

```

### 输出 #1

```
4

```

## 说明/提示

对于 $100\%$ 数据，满足 $n \lt 10^{30}$，$k \le 15$。

**【题目来源】**

NOIP 2002 普及组第三题

# 思路分析
> [!warning] 写在前面
> 以下思路存在错误！写在这里起到警醒提示作用！记录思考修正经历

首先，利用数学中的乘法原理，分析得到：**对一个 $m$ 位数字，其可能变换得到的数字数量即为各位数字可能变换得到数字的乘积**。那么只需要单独分析各位数字的变换情况即可。
那么各个数字的变换关系已经给出，就可以把各个映射视为一个[[图论相关概念#有向图|有向图]]来处理。那么得到某位数字的可能变换得到数字，就等价于其可达的节点数量（包括自身）。

## 错误思路提醒：使用动态优化完成
假设 $f(u)$ 表示 $u$ 节点的所有可达节点，$N(u)$ 表示其所有后继节点的集合，那么列出状态转移方程：$$f(u)=1+\sum_{v \in N(u)}f(v)$$ 故使用[[递归与动态规划]]来完成节点的搜索：（图的存储使用了[[图的存储#链式前向星|链式前向星]]）
```cpp
#include <bits/stdc++.h>
using namespace std;

int to[45],nxt[45],head[10]; // forward star
int dp[10];

int search(int x){
    if(dp[x] >= 0)return dp[x];
    if(head[x] == -1){dp[x] = 1;return 1;}
    int sum = 1;
    for(int e = head[x];e != -1;e = nxt[e])sum += search(to[e]);
    dp[x] = sum;return sum;
}

int main(){
    int n,k;scanf("%d%d",&n,&k);
    memset(to,-1,sizeof(int)*45);memset(nxt,-1,sizeof(int)*45);
    memset(head,-1,sizeof(int)*10);memset(dp,-1,sizeof(int)*10);
    int a,b,ans=1;
    for(int i = 0;i < k;i++){
        scanf("%d%d",&a,&b);
        nxt[i]=head[a];head[a]=i;to[i]=b;}
    for(int temp = n;temp > 0;temp/=10)ans*=search(temp%10);
    printf("%d",ans);
    return 0;
}
```

![[Pasted image 20260926223210.png]]


> [!NOTE] 数组的最大长度
> 由于只有十个一位数，因此总节点数不可能大于 10 。
> 由于 $K_{10}$ 完全图的边数是 $C_{10}^2=45$ ，因此边的数量不可能超过 45 。

### 错误分析
为什么会出现 MLE ？是因为过程中没有考虑[[图论相关概念#圈|圈]]出现的情况。如果出现圈，则会导致无限递归，调用栈超出内存限制导致 MLE 。

## 思路调整
现在找出了问题出在对圈的处理上。由于[[有向无环图#DAG 上的 DP|动态规划]]处理图的方法只能用在[[有向无环图]]上。因此考虑使用 [[Floyd 算法]]的思想，引入中间节点 $k$ ，判断所有节点之间是否可达，然后再统计节点可达数量。而且因为节点的数量不可能大于 10 ，使用[[图的存储#邻接矩阵|邻接矩阵]]存储是合适的。

假设 $f(x,y)$ 表示从节点 $x$ 到 $y$ 之间是否可达。那么 $\forall k\in N ,\exists f(x,k) ~and~f(k,y)=true,f(x,y)=true$。
特别地，$f(x,x)=true$ ，若存在边 $(u,v)$ ，则 $f(u,v)=true$ 。
按照此思路完成，得到代码：
```cpp
#include <bits/stdc++.h>
using namespace std;

int main(){
    int n,k;scanf("%d%d",&n,&k);
    bool r[10*10] = {false};
    for(int i = 0;i < 10;i++) r[i*10+i]=true;
    int a,b;
    for(int i = 0;i < k;i++){scanf("%d%d",&a,&b);r[a*10+b] = true;}
    // floyd
    for(int m = 0;m < 10;m++)
        for(int x = 0;x < 10;x++)
            for(int y = 0;y < 10;y++) 
                r[x*10+y] = r[x*10+y] || (r[x*10+m] && r[m*10+y]);
    // count
    int cnt[10] = {0};
    for(int i = 0;i < 10;i++)
        for(int j = 0;j < 10;j++)
        if(r[i*10+j]==1)cnt[i]++;
    
    long long ans = 1;
    for(int temp = n;temp > 0;temp /= 10) ans*=cnt[temp%10];
    printf("%d",ans);
    return 0;
}

```
![[Pasted image 20260927004509.png]]

为什么出现 WA ？因为题目中强调 $n \lt 10^{30}$ , 而 int 类型不够存放这个数据，导致报错。因此，使用[[高精度算法]]继续修复。
# 解题代码
```cpp
#include <bits/stdc++.h>
using namespace std;
string mul(string a,int b){
    int c=0,len=a.size(),sum=0;
    string ans = "";
    for(int i = len-1;i>=0;i--){
        sum=c+(a[i]-'0')*b;ans+=('0'+(sum%10));c=sum/10;
    }if(c>0) ans+=('0'+c);reverse(ans.begin(),ans.end());
    return ans;
}
int main(){
    string n;int k;cin>>n>>k;
    bool r[10*10] = {false};
    for(int i = 0;i < 10;i++) r[i*10+i]=true;
    int a,b;
    for(int i = 0;i < k;i++){scanf("%d%d",&a,&b);r[a*10+b] = true;}
    // floyd
    for(int m = 0;m < 10;m++)
        for(int x = 0;x < 10;x++)
            for(int y = 0;y < 10;y++)
                r[x*10+y] = r[x*10+y] || (r[x*10+m] && r[m*10+y]);
    // count
    int cnt[10] = {0};
    for(int i = 0;i < 10;i++)
        for(int j = 0;j < 10;j++)
        if(r[i*10+j]==1)cnt[i]++;
    string ans = "1";int len = n.size();
    for(int i = 0;i < len;i++) ans = mul(ans,cnt[n[i]-'0']);
    cout<<ans;
    return 0;
}
```
