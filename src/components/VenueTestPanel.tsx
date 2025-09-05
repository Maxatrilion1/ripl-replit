import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const VenueTestPanel = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runVenueTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    try {
      // Test 1: Check if unauthenticated users can view venues (should pass)
      console.log('🧪 Testing venue SELECT for public access...');
      try {
        const { data, error } = await supabase
          .from('venues')
          .select('*')
          .limit(1);

        if (error) {
          testResults.push({
            test: 'Public Venue Select',
            status: 'fail',
            message: `Failed: ${error.message}`
          });
        } else {
          testResults.push({
            test: 'Public Venue Select',
            status: 'pass',
            message: `Success: Retrieved ${data.length} venues`
          });
        }
      } catch (err) {
        testResults.push({
          test: 'Public Venue Select',
          status: 'fail',
          message: `Exception: ${err}`
        });
      }

      // Test 2: Check if authenticated users can insert venues (should pass if authenticated)
      if (user) {
        console.log('🧪 Testing venue INSERT for authenticated users...');
        const testVenue = {
          name: `Test Venue ${Date.now()}`,
          address: 'Test Address',
          latitude: 38.0,
          longitude: -78.0,
          google_place_id: `test_${Date.now()}`
        };

        try {
          const { data, error } = await supabase
            .from('venues')
            .insert(testVenue)
            .select()
            .single();

          if (error) {
            testResults.push({
              test: 'Authenticated Venue Insert',
              status: 'fail',
              message: `Failed: ${error.message}`
            });
          } else {
            testResults.push({
              test: 'Authenticated Venue Insert',
              status: 'pass',
              message: `Success: Created venue ${data.id}`
            });

            // Clean up test venue
            await supabase
              .from('venues')
              .delete()
              .eq('id', data.id);
          }
        } catch (err) {
          testResults.push({
            test: 'Authenticated Venue Insert',
            status: 'fail',
            message: `Exception: ${err}`
          });
        }
      } else {
        testResults.push({
          test: 'Authenticated Venue Insert',
          status: 'warning',
          message: 'Skipped: User not authenticated'
        });
      }

      // Test 3: Check RLS policies exist
      console.log('🧪 Testing RLS policy existence...');
      testResults.push({
        test: 'RLS Policy Check',
        status: 'warning',
        message: 'Manual verification needed - check Supabase dashboard for venue RLS policies'
      });

      // Test 4: Anonymous user restrictions
      if (user?.user_metadata?.is_anonymous) {
        console.log('🧪 Testing anonymous user venue creation...');
        const testVenue = {
          name: `Anonymous Test ${Date.now()}`,
          address: 'Anonymous Test Address',
          latitude: 38.0,
          longitude: -78.0,
          google_place_id: `anon_test_${Date.now()}`
        };

        try {
          const { data, error } = await supabase
            .from('venues')
            .insert(testVenue)
            .select()
            .single();

          if (error) {
            testResults.push({
              test: 'Anonymous Venue Insert',
              status: 'pass',
              message: 'Correctly blocked: Anonymous users cannot create venues'
            });
          } else {
            testResults.push({
              test: 'Anonymous Venue Insert',
              status: 'warning',
              message: 'Unexpected: Anonymous user was able to create venue'
            });
            
            // Clean up
            await supabase
              .from('venues')
              .delete()
              .eq('id', data.id);
          }
        } catch (err) {
          testResults.push({
            test: 'Anonymous Venue Insert',
            status: 'pass',
            message: 'Correctly blocked: Anonymous access denied'
          });
        }
      }

    } catch (error) {
      console.error('Venue test error:', error);
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Warning</Badge>;
    }
  };

  return (
    <Card className="mb-6 border-cowork-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Venue RLS Testing
        </CardTitle>
        <CardDescription>
          Verify venue creation and selection works correctly with Row Level Security
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Expected Behavior:</strong> Public can view venues, authenticated users can create venues. 
            Anonymous users should be blocked from creating venues but can view existing ones.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-2">
          <Button 
            onClick={runVenueTests}
            disabled={testing}
            variant="outline"
          >
            {testing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <TestTube className="w-4 h-4 mr-2" />
            )}
            Run RLS Tests
          </Button>
          
          {user ? (
            <Badge variant="secondary">
              {user.user_metadata?.is_anonymous ? 'Anonymous User' : 'Authenticated User'}
            </Badge>
          ) : (
            <Badge variant="outline">Unauthenticated</Badge>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result.status)}
                  <span className="font-medium">{result.test}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result.status)}
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-muted/20 rounded-lg">
              <h5 className="font-medium mb-2">Detailed Messages:</h5>
              {results.map((result, index) => (
                <div key={index} className="text-sm text-muted-foreground mb-1">
                  <strong>{result.test}:</strong> {result.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VenueTestPanel;