from flask import Flask, render_template, url_for, request, session, redirect
from flask_pymongo import PyMongo
import json
from datetime import datetime
from pytz import timezone
fmt = "%Y-%m-%d %H:%M:%S %Z%z"
null=0
app = Flask(__name__)

app.config['MONGO_DBNAME'] = 'transactions'
app.config['MONGO_URI'] = 'mongodb://localhost:27017/transactions'

mongo = PyMongo(app)

@app.route('/')
def index():
    if 'account_number' in session:
    	users = mongo.db.users
    	login_user = users.find_one({'account_number' : session['account_number']})
    	result=login_user['name']
    	x=users.find_one({"account_number": session['account_number'],"survey":{'$exists':True}},{"_id":0,"survey":1})
    	if(login_user['gender']=='Male'):
    		gender=True
    		if x:
    			if(login_user['account_number']=='9848012345'):
	    			return render_template('logout.html',result=result,number=login_user['survey']['stat'],bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],gender=gender,admin=True)
	    		else:
	    			return render_template('logout.html',result=result,number=login_user['survey']['stat'],bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],gender=gender,admin=False)
	    	else:
	    		if(login_user['account_number']=='9848012345'):
	    			return render_template('logout.html',result=result,bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],gender=gender,admin=True)
	    		else:
	    			return render_template('logout.html',result=result,bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],gender=gender,admin=False)	    			

    	gender=False
    	if x:
    		if(login_user['account_number']=='9848012345'):
    			return render_template('logout.html',result=result,number=login_user['survey']['stat'],bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],gender=gender,admin=True)
    		else:
    			return render_template('logout.html',result=result,number=login_user['survey']['stat'],bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],gender=gender,admin=False)
    	else:
    		if(login_user['account_number']=='9848012345'):
    			return render_template('logout.html',result=result,bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],gender=gender,admin=True)
    		else:
    			return render_template('logout.html',result=result,bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],gender=gender,admin=False)

    return render_template('index.html')

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route('/login', methods=['POST'])
def login():
    users = mongo.db.users
    login_user = users.find_one({'account_number' : request.form['number']})

    if login_user:
        if ((request.form['pass'] == login_user['password']) and login_user['approve']==1):
            session['account_number'] =request.form['number']
            return redirect(url_for('index'))
        elif((request.form['pass'] == login_user['password']) and login_user['approve']==0):
        	return render_template('wait.html')

    pa='som'
    return render_template('index.html',rena=pa)


@app.route('/update',methods=['POST','GET'])
def update():
	if request.method == 'POST':
		users = mongo.db.users
		login_user = users.find_one({'account_number' : session['account_number']})
		pass1=request.form['pass']
		pass2=request.form['passs']
		name1=login_user['account_number']
		ren=False
		if(pass1 == pass2):
			if(login_user['password']!=pass1):
				hashpass1 = pass1
				users.update({"account_number":name1}, { '$set': {"password":hashpass1}},multi=True)
				session.clear()
			else:
				return render_template('update.html',ren1=True)
		else:
			return render_template('update.html',ren=True)
		
		return redirect(url_for('index'))

	return render_template('update.html')

@app.route('/delete',methods=['POST','GET'])
def delete():
	if request.method == 'POST':
		users = mongo.db.users
		login_user = users.find_one({'account_number' : session['account_number']})
		pass1=request.form['pass']
		account=request.form['account_number']
		if request.form['pass'] == login_user['password']:
			users.remove( { "account_number" : account } )
		else:
			return render_template('delete.html',ren=pass1)

		return redirect(url_for('index'))

	return render_template('delete.html')
@app.route('/approve',methods=['POST','GET'])
def approve():
	if request.method == 'POST':
		users = mongo.db.users
		login_user = users.find_one({'account_number' : session['account_number']})
		pass1=request.form['pass']
		account=request.form['account_number']
		if request.form['pass'] == login_user['password']:
			users.update_one({'account_number':account},{'$set':{'approve':1}})
		else:
			return render_template('approve.html',ren=pass1)

		return redirect(url_for('index'))

	return render_template('approve.html')

@app.route('/forgot',methods=['POST','GET'])
def forgot():
	if request.method == 'POST':
		users = mongo.db.users
		login_user = users.find_one({'$and':[{"account_number":request.form['account_number']},{"secret":request.form['secret'] }]})
		if login_user:
			return render_template('forgot.html',ren=login_user['password'])
		else:
			return render_template('forgot.html',rena='nagiosway2venkyuiiiiiiyytytytytyytytytytyytytyt')

	return render_template('forgot.html')

@app.route('/register', methods=['POST', 'GET'])
def register():
    if request.method == 'POST':
        users = mongo.db.users
        existing_user = users.find_one({'account_number' : request.form['number']})

        if existing_user is None:
			hashpass = request.form['pass']
			account = request.form['number']
			users.insert({'name' : request.form['username'],'secret' : request.form['secret'], 'password' : hashpass,'account_number':account,'money':10000,'gender':request.form['gender'],'approve':0})
			return redirect(url_for('index'))
        else:
        	pa='some'
        	return render_template('register.html',rena=pa)
       	    
    return render_template('register.html')
@app.route('/transact', methods=['POST', 'GET'])
def transact():
	if request.method == 'POST':
		users=mongo.db.users
		login_user = users.find_one({'account_number' : session['account_number']})
		first=login_user['money']
		transactions = mongo.db.transactions
		source = request.form['source account']
		destination=request.form['destination account']
		amount1=int(request.form['amount'])
		res=users.find_one({'account_number':destination})
		val=False
		if(res and (session['account_number']!=destination) and (destination!='9848012345')):
			result=transactions.insert_one({'source' :source,'destination' : destination, 'amount' : amount1,'status':'initial'})
			if(amount1>0):
				users.update({'$and':[{'money':{'$gt': 0 }},{'money':{'$gte': amount1 }},{'account_number':source}]},{'$inc':{'money':-amount1}})
			else:
				users.update({'$and':[{'money':{'$gt': 0 }},{'money':{'$gte': amount1 }},{'account_number':source}]},{'$inc':{'money':0}})
			login_user = users.find_one({'account_number' : session['account_number']})
			second=login_user['money']
			if(first == second):
				transactions.update_one({'_id':result.inserted_id},{'$set':{'status':'transaction fails'}})
				return render_template('trans.html',trans='last transaction fails',number=session['account_number'])
				# return render_template('logout.html',result=login_user['name'],number=login_user['survey']['stat'],bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],trans='transaction fails')
			else:
				users.update({'account_number':destination},{'$inc':{'money':amount1}})
				transactions.update_one({'_id':result.inserted_id},{'$set':{'status':'transaction sucess'}})
				return render_template('trans.html',trans='last transaction success',number=session['account_number'])
				# return render_template('logout.html',result=login_user['name'],number=login_user['survey']['stat'],bal=login_user['money'],name=login_user['name'],account=login_user['account_number'],trans='transaction success')
		else:
			return render_template('trans.html',nu=destination,val=True,number=session['account_number'])
	return render_template('trans.html',number=session['account_number'])


@app.route('/survey', methods=['POST', 'GET'])
def survey():
    if request.method == 'POST':
        users = mongo.db.users
        job=request.form['job']
        users.update_one({'account_number':session['account_number']},{'$set':{'survey':{'marriage':request.form['marriage'],'game':request.form['game'],'place':request.form['place'],'industry':request.form['industry'],'hobby':request.form['hobby'],'job':job,'stat':True}}})
        existing_user = users.find_one({'account_number' : session['account_number']})
        result=existing_user['name']
        if(existing_user['gender']=='Male'):
        	gender=True
        	return render_template('logout.html',number=existing_user['survey']['stat'],result=result,bal=existing_user['money'],name=existing_user['name'],account=existing_user['account_number'],gender=gender)
        else:
        	gender=False
        	return render_template('logout.html',number=existing_user['survey']['stat'],result=result,bal=existing_user['money'],name=existing_user['name'],account=existing_user['account_number'],gender=gender)
    return render_template('survey.html')


@app.route('/dues',methods=['GET'])
def dues():
	users = mongo.db.users
	transactions=mongo.db.transactions
	existing_user = users.find_one({'account_number' : session['account_number']})
	v=transactions.find({ '$or': [ { 'source':session['account_number']  }, {'$and':[{ 'destination':session['account_number']  },{'status':'transaction sucess'}]},{'$and':[{ 'source':'BANK'},{'status':'transaction sucess'},{'destination':session['account_number']}]} ] }).limit(10).sort([("_id", -1)])
	arr=[]
	for i in range (0,v.count()):
		now=v[i]['_id'].generation_time.astimezone(timezone('Asia/Calcutta'))
		arr.append(now.strftime(fmt))

	# print arr
	return render_template('dues.html',num=v,a=arr,su=session['account_number'])
@app.route('/requests',methods=['GET'])
def requests():
	users = mongo.db.users
	v=users.find({'approve':0}).sort([("_id", 1)])
	# print arr
	return render_template('requests.html',num=v)

@app.route('/users',methods=['GET'])
def users():
	users = mongo.db.users
	v=users.find({'account_number':{'$ne':'9848012345'}}).sort([("_id", 1)])
	# print arr
	return render_template('users.html',num=v)

@app.route('/atm',methods=['POST','GET'])
def atm():
	if request.method == 'POST':
		users =mongo.db.users
		transactions=mongo.db.transactions
		bal=int(request.form['balance'])
		login_user=users.find_one({'account_number' : session['account_number']})
		amount1=login_user['money']
		result=transactions.insert_one({'source' :session['account_number'],'destination' : 'ATM', 'amount' : bal,'status':'initial'})
		if(bal>0):
			users.update({'$and':[{'money':{'$gt': 0 }},{'money':{'$gte': bal }},{'account_number':session['account_number']}]},{'$inc':{'money':-bal}})
		else:
			users.update({'$and':[{'money':{'$gt': 0 }},{'money':{'$gte': bal }},{'account_number':session['account_number']}]},{'$inc':{'money':0}})
		login_user=users.find_one({'account_number' : session['account_number']})
		amount2=login_user['money']
		if(amount1==amount2):
			transactions.update_one({'_id':result.inserted_id},{'$set':{'status':'transaction fails'}})
			return render_template('atm.html',ren='transaction fails')
		else:
			transactions.update_one({'_id':result.inserted_id},{'$set':{'status':'transaction sucess'}})
			return render_template('atm.html',ren='transaction sucess')
	return render_template('atm.html')
@app.route('/bank',methods=['POST','GET'])
def bank():
	if request.method == 'POST':
		users =mongo.db.users
		transactions=mongo.db.transactions
		bal=int(request.form['balance'])
		login_user=users.find_one({'account_number' : request.form['account_number']})
		amount1=login_user['money']
		result=transactions.insert_one({'source' :'BANK','destination' : request.form['account_number'], 'amount' : bal,'status':'initial'})
		users.update({'$and':[{'money':{'$gt': 0 }},{'money':{'$gte': bal }},{'account_number':request.form['account_number']}]},{'$inc':{'money':bal}})
		login_user=users.find_one({'account_number' : request.form['account_number']})
		amount2=login_user['money']
		if(amount1==amount2):
			transactions.update_one({'_id':result.inserted_id},{'$set':{'status':'transaction fails'}})
			return render_template('bank.html',ren='transaction fails')
		else:
			transactions.update_one({'_id':result.inserted_id},{'$set':{'status':'transaction sucess'}})
			return render_template('bank.html',ren='transaction sucess')
	return render_template('bank.html')
if __name__ == '__main__':
    app.secret_key = 'mysecret'
    app.run(host='192.168.1.115',port=5000,debug=True)